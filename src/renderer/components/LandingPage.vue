<template>
  <div id="wrapper">
    <img id="logo" src="~@/assets/terraform.png" alt="electron-vue" />
    <div class="main">
      <toast :value="alertMessage" v-if="alertMessage"></toast>
      <div class="left-side">
        <span class="title"> Terra Bros Tools </span>
        <div class="doc">
          <label for="dir-input" class="file-label"
            >Set working directory</label
          >
          <input
            id="dir-input"
            type="file"
            @change="selectDirectory"
            webkitdirectory
            directory
            class="hidden"
          />
        </div>
        <div class="doc" v-if="working_directory">
          <div class="title alt">Dir:</div>
          <p>{{ working_directory }}</p>
          <div class="title alt">Sub Directories</div>

          <v-card class="mx-auto" max-width="400" tile>
            <v-list-item v-for="(name, i) in directories" :key="i">
              <v-list-item-content>
                <v-list-item-title>{{ name }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-card>
        </div>
      </div>

      <div class="right-side">
        <div class="doc">
          <div class="title">Tools</div>
        </div>
        <div class="doc" v-if="working_directory">
          <div class="grid">
            <button @click="handleRename">Rename directory prefixes</button>
            <button @click="handleStripGit">Strip Git</button>
            <button @click="handleStripTemplate">Strip Template</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Toast from "./Toast";
const fs = window.require("fs");

export default {
  name: "landing-page",
  components: { Toast },

  data() {
    return {
      working_directory: "",
      selectedInput: null,
      directories: [],
      alertMessage: "",
    };
  },

  methods: {
    open(link) {
      this.$electron.shell.openExternal(link);
    },

    selectDirectory(e) {
      console.log(e.target.files[0].path);
      if (e.target.files) {
        this.working_directory = e.target.files[0].path;
      }
      this.readDirectories();
    },

    readDirectories() {
      fs.readdir(this.working_directory, (err, dir) => {
        if (err) {
          console.error(err);
          return;
        }
        this.directories = dir;
      });
    },

    handleRename() {
      let find = "azure-";
      let replace = "terraform-azurerm-";
      let count = 0;
      this.directories.forEach((path) => {
        if (path.includes(find)) {
          let newPath =
            this.working_directory + "/" + path.replace(find, replace);
          let currPath = this.working_directory + "/" + path;
          console.log(path + " to " + path.replace(find, replace));
          fs.renameSync(currPath, newPath);
          count++;
        }
      });
      this.showAlert("Renamed " + count + " directories");
    },
    handleStripGit() {
      let count = 0;
      this.directories.forEach((path) => {
        let removePath = this.working_directory + "/" + path + "/.git";
        if (fs.existsSync(removePath)) {
          this.deleteFolderRecursive(removePath);
          count++;
        }
      });
      this.showAlert("Removed " + count + " directories");
    },

    handleStripTemplate() {
      let count = 0;
      this.directories.forEach((path) => {
        let removePath = this.working_directory + "/" + path + "/template";
        if (fs.existsSync(removePath)) {
          this.deleteFolderRecursive(removePath);
          count++;
        }
      });
      this.showAlert("Removed " + count + " directories");
    },

    deleteFolderRecursive(path) {
      if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
          var curPath = path + "/" + file;
          if (fs.lstatSync(curPath).isDirectory()) {
            // recurse
            this.deleteFolderRecursive(curPath);
          } else {
            // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(path);
      }
    },

    showAlert(message) {
      this.alertMessage = message;
      setTimeout(() => (this.alertMessage = ""), 1000);
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Source Sans Pro", sans-serif;
}

#wrapper {
  background: radial-gradient(
    ellipse at top left,
    rgba(255, 255, 255, 1) 40%,
    rgba(229, 229, 229, 0.9) 100%
  );
  height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}

#logo {
  height: auto;
  margin-bottom: 20px;
  width: 100px;
}

.main {
  display: flex;
  justify-content: space-between;
}

.main > div {
  flex-basis: 50%;
}

.left-side {
  display: flex;
  flex-direction: column;
}

.welcome {
  color: #555;
  font-size: 23px;
  margin-bottom: 10px;
}

.title {
  color: #2c3e50;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 6px;
}

.title.alt {
  font-size: 18px;
  margin-bottom: 10px;
}

.doc p {
  color: black;
  margin-bottom: 10px;
}

.doc button {
  font-size: 0.8em;
  cursor: pointer;
  outline: none;
  padding: 0.75em 2em;
  border-radius: 2em;
  display: inline-block;
  color: #fff;
  background-color: #4fc08d;
  transition: all 0.15s ease;
  box-sizing: border-box;
  border: 1px solid #4fc08d;
}

.doc button.alt {
  color: #42b983;
  background-color: transparent;
}

.file-label {
  font-size: 0.8em;
  cursor: pointer;
  outline: none;
  padding: 0.75em 2em;
  border-radius: 2em;
  display: inline-block;
  color: #fff;
  background-color: #4fc08d;
  transition: all 0.15s ease;
  box-sizing: border-box;
  border: 1px solid #4fc08d;
}

.hidden {
  display: none;
}
.grid {
  display: inline-grid;
}
.grid button {
  margin-top: 5px;
}
</style>
