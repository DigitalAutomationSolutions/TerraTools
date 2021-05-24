<template>
  <div>
    <div class="columns" v-if="!showCode">

      <div class="column">

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
                    <label class="checkbox">
                      <input type="checkbox" v-model="moduleList" :value="name">
                      {{ name }}
                    </label>
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
            <button @click="handleBuild">Build</button>
            <button @click="moduleList = []">Remove All</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card" v-else-if="showCode">
      <div class="card-title alt">
        <p class="card-header-title">Code</p>
      </div>
      <section class="modal-card-body">
        <div class="scroll">
<!--          <pre >{{moduleOutput}}</pre>-->
          <textarea id="module-output" style="width:100%;min-height: 400px;overflow-y: auto">{{moduleOutput}}</textarea>
        </div>
      </section>
      <div class="columns">
        <div class="column">
          <button @click="showCode = false" class="file-label">Cancel</button>
        </div>
        <div class="column">
          <button @click="copy" class="file-label">Copy</button>
        </div>
      </div>

    </div>
<!--    <base-modal v-if="showCode" @close="showCode = false">-->
<!--      <h3 slot="header">Build List</h3>-->
<!--      <div slot="body" class="mt-5">-->
<!--        <div class="card">-->
<!--          <div class="card-title alt">-->
<!--            <p class="card-header-title">Directory Contents</p>-->
<!--          </div>-->
<!--          <section class="modal-card-body">-->
<!--            <div class="scroll">-->
<!--              <pre id="module-output">{{moduleOutput}}</pre>-->
<!--            </div>-->
<!--          </section>-->

<!--        </div>-->
<!--      </div>-->
<!--      <div slot="footer" class="mt-5 mb-2">-->
<!--        <div class="field is-grouped">-->
<!--          <div class="control">-->
<!--            <button @click="showCode = false" class="file-label">Cancel</button>-->
<!--          </div>-->
<!--          <div class="control">-->
<!--            <button @click="copy" class="file-label" >Copy to Clipboard</button>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
<!--    </base-modal>-->
  </div>
</template>

<script>
import BaseModal from "../components/BaseModal";


const fs = window.require("fs");
const Path = require("path");
const parser = require('@evops/hcl-terraform-parser');
const readline = require('readline');

export default {
  name: "CodeGenerator",
  components: {BaseModal},
  data() {
    return {
      working_directory: "",
      selectedInput: null,
      directories: [],
      alertMessage: "",
      moduleList: [],
      removeInput: null,
      showCode: false,
      moduleOutput: null,
    };
  },

  methods: {
    open(link) {
      this.$electron.shell.openExternal(link);
    },

    selectDirectory(e) {
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
        this.directories = dir.filter(d => !d.startsWith('.'));
      });
    },

    async handleBuild() {
      this.buildModules();

      this.showCode = true
    },

    async buildModules() {
      let JSONBuild = this.moduleList.map( m => {
        const dirPath = this.working_directory + '/' + m;
        const varPath = dirPath + '/variables.tf';
        const gitConfigPath = dirPath + '/.git/config';

        let gitUrl = this.getGitUrl(gitConfigPath);

        // use cli to get remote
        // const { exec } = require('child_process');
        //
        // let gitUrl = null;
        // exec(`cd ${dirPath} && git remote get-url origin`, (err, stdout, stderr) => {
        //   // handle err, stdout & stderr
        //   console.log(stdout)
        //   if(stdout) {
        //     gitUrl = stdout;
        //   }
        // });

        let variables = [];
        if(fs.existsSync(varPath)) {
          const content = fs.readFileSync(varPath);
          const hclFile = parser.parse(content);
          variables = Object.keys(hclFile.variables)
        }

        return {name: m, variables, source: gitUrl}
      })
      console.log(JSONBuild)

      this.moduleOutput = this.buildModulesFromJson(JSONBuild);
      console.log('moduleOutput', this.moduleOutput)
    },

    async copy(s) {
      var copyText = document.querySelector("#module-output");
      copyText.select();
      document.execCommand("copy");
      alert('Copied!');
    },

    /**
     * module "json_vars_parser" {
        source = "yurymkomarov/terraform-local-json-vars-parser"
        custom_vars = file("${path.root}/../vars.json")
      }
     */
    buildModulesFromJson(json) {
      let moduleMap = json.map(module => {
        let output = `module "${module.name}" {\n`;
        output += `\tsource = "${module.source}"\n\n`;

        for(let variable of module.variables) {
          output += `\t${variable} = var.${variable}\n`;
        }
        output += "}\n";
        return output;
      })

      return moduleMap.join("\n");
    },

    getGitUrl(gitConfigPath) {
      if(fs.existsSync(gitConfigPath)) {

        let gitUrl = null
        const data = fs.readFileSync(gitConfigPath, 'utf8')
        gitUrl = data.split("\n").find(l => l.includes('url = '))

        return gitUrl !== null ? gitUrl.replace('url = ', '').trim(): null;

      } else {
        console.log("File not found: ", gitConfigPath);
        return null
      }
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
}
</script>

<style scoped>
.scroll {
  height: auto;
  max-height: 400px;
  overflow: auto;
  background-color: #eeeeee;
  word-break: normal !important;
  word-wrap: normal !important;
  white-space: pre !important;
}
</style>
