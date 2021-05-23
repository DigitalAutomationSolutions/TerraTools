<template>
  <div class="columns">
    <div class="column">
      <button class="button is-primary is-outlined" @click="$router.push('file-tools')"> File Tools</button>
    </div>
    <div class="column">
      <button class="button is-primary is-outlined"  @click="$router.push('file-tools')">Set up Repos</button>
    </div>
    <div class="column">
      <button class="button is-primary is-outlined"  @click="$router.push('code-generator')">Code Generator</button>
    </div>
  </div>
</template>

<script>


const fs = window.require("fs");
const Path = require("path");

export default {
  name: "landing-page",
  data() {
    return {
      working_directory: "",
      selectedInput: null,
      directories: [],
      alertMessage: "",
      renameDialog: false,
      removeDialog: false,
      renameFind: "azure-",
      renameReplace: "terraform-azurerm-",
      removeList: [],
      removeInput: null,
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
        this.readDirectories();
        this.getDirectories(this.working_directory)
      } else {
        this.showAlert("Can't find directory")
      }
    },

    readDirectories() {
      fs.readdir(this.working_directory, (err, dir) => {
        if (err) {
          console.error(err);
          this.showAlert(err)
          return;
        }
        this.directories = dir;
      });
    },

    handleRename() {
      this.renameDialog = false

      let find = this.renameFind;
      let replace = this.renameReplace;
      let count = 0;
      this.directories.forEach((path) => {
        if (path.includes(find)) {
          let newPath =
              this.working_directory + "/" + path.replace(find, replace);
          let currPath = this.working_directory + "/" + path;
          console.log(path + " to " + path.replace(find, replace));
          if (!fs.existsSync(newPath)) {
            fs.renameSync(currPath, newPath);
            count++;
          }
        }
      });
      this.readDirectories();
      this.showAlert("Renamed " + count + " directories");

      this.renameFind = null;
      this.renameReplace = null;
    },

    handleRemove() {
      let count = 0;
      this.removeList.forEach((removeItem) => {
        this.directories.forEach((path) => {
          let removePath = this.working_directory + "/" + path + "/" + removeItem;
          if (fs.existsSync(removePath) && fs.lstatSync(removePath).isDirectory()) {
            this.deleteFolderRecursive(removePath);
            count++;
          } else if (fs.existsSync(removePath) && fs.lstatSync(removePath).isFile()) {
            fs.readFileSync(removePath)
            count++
          }
        });
      })

      this.removeDialog = false
      this.removeList = []
      this.showAlert("Removed " + count + " files/directories");
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

    addToRemoveList() {
      console.log('addToRemoveList')
      this.removeList.push(this.removeInput)
      this.removeInput = null
    },

    removeItemFromList(index) {
      this.removeList.splice(index, 1)
    },

    getDirectories(directory) {
      let files = [];
      let fileTree = {};
      let base = directory;

      const getFilesRecursively = (directory) => {
        const filesInDirectory = fs.readdirSync(directory);
        for (const file of filesInDirectory) {
          const absolute = Path.join(directory, file);
          if (fs.statSync(absolute).isDirectory()) {
            getFilesRecursively(absolute);
          } else {
            files.push(absolute);
          }
        }

      };
      getFilesRecursively(directory)
      console.log('files', files)
    },


  },
};
</script>

<style>
</style>
