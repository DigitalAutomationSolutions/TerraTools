<template>
  <div >
    <div class="main">

      <div class="left-side mr-5">

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
        <div class="doc mt-5" v-if="working_directory">
          <div class="title alt mt-5">Dir:</div>
          <p>{{ working_directory }}</p>

          <div class="card">
            <div class="card-title alt">
              <p class="card-header-title">Directory Contents</p>
            </div>
            <div class="card-content">
              <div class='list'>
                <ul>
                  <div class='list-item' v-for="(name, i) in directories" :key="i">
                    <li>
                      {{ name }}
                    </li>
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-side">
        <div class="doc">
          <div class="title">Tools</div>
        </div>
        <div class="doc" v-if="working_directory">
          <div class="grid">
            <button @click="renameDialog = true">Rename directory prefixes</button>
            <button @click="removeDialog = true">Remove Files/Folders By Name</button>
          </div>
        </div>
      </div>
    </div>
    <base-modal v-if="renameDialog" @close="renameDialog = false">
      <h3 slot="header">Rename Directories</h3>
      <div slot="body" class="mt-5">
        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label">Find</label>
          </div>
          <div class="field-body">
            <div class="field">
              <p class="control">
                <input class="input" v-model="renameFind">
              </p>
            </div>
          </div>
        </div>

        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label">Replace</label>
          </div>
          <div class="field-body">
            <div class="field">
              <p class="control">
                <input class="input" v-model="renameReplace">
              </p>
            </div>
          </div>
        </div>
      </div>
      <div slot="footer" class="mt-5 mb-2">
        <div class="field is-grouped">
          <div class="control">
            <button @click="renameDialog = false" class="file-label">Cancel</button>
          </div>
          <div class="control">
            <button @click="handleRename" class="file-label">Proceed</button>
          </div>
        </div>
      </div>
    </base-modal>

    <base-modal v-if="removeDialog" @close="removeDialog = false">
      <h3 slot="header">Remove Files / Directories</h3>
      <div slot="body" class="mt-5">
        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label">Remove</label>
          </div>
          <div class="field-body">
            <div class="field">
              <p class="control is-flex">
                <input class="input" v-model="removeInput">
                <button class="button is-primary is-outlined" @click="addToRemoveList">Add</button>
              </p>
            </div>
          </div>
        </div>

        <div class="tags">
          <span class="tag is-warning is-medium" v-for="(item, index) in removeList">
            {{ item }}
            <button class="delete is-small" @click="removeItemFromList(index)"></button>
          </span>
        </div>

      </div>
      <div slot="footer" class="mt-5 mb-2">
        <div class="field is-grouped">
          <div class="control">
            <button @click="removeDialog = false" class="file-label">Cancel</button>
          </div>
          <div class="control">
            <button @click="handleRemove" class="file-label">Proceed</button>
          </div>
        </div>
      </div>
    </base-modal>

  </div>
</template>

<script>
import Toast from "../components/Toast";
import BaseModal from "../components/BaseModal";
import PlusIcon from "../components/PlusIcon";

const fs = window.require("fs");
const Path = require("path");

export default {
  name: "landing-page",
  components: {Toast, BaseModal, PlusIcon},

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

