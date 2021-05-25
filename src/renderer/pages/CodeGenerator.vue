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
          <pre style="width:100%;min-height: 400px" ><code id="module-output" >{{moduleOutput}}</code></pre>
        </div>
      </section>
      <div class="columns">
        <div class="column"></div>
        <div class="column">
          <button @click="showCode = false" class="file-label">Cancel</button>
        </div>
        <div class="column">
          <button @click="copy" class="file-label">Copy</button>
        </div>
      </div>

    </div>

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
      let JSONBuild = this.moduleList.map(m => {
        const dirPath = this.working_directory + '/' + m;
        const varPath = dirPath + '/variables.tf';
        const gitConfigPath = dirPath + '/.git/config';

        let gitUrl = this.getGitUrl(gitConfigPath);

        //find all tf tiles
        let files = this.getAllFilesRecursive(dirPath).filter(file => file.endsWith('.tf'));

        console.log('files for ' + dirPath, files)

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
        for(let file of files) {
          let tempVars = this.getFileVariables(file);
          console.log('tempVars', tempVars, file);
          variables = variables.concat(tempVars);
        }


        return {name: m, variables, source: gitUrl}
      })
      console.log(JSONBuild)

      this.moduleOutput = this.buildModulesFromJson(JSONBuild);
      console.log('moduleOutput', this.moduleOutput)
    },

    getFileVariables(varPath) {
      let variables = [];
      if (fs.existsSync(varPath)) {
        const content = fs.readFileSync(varPath);
        const hclFile = parser.parse(content);
        variables = Object.keys(hclFile.variables)

      } else {
        console.log('File Not Found '+ varPath)
      }

      return variables;
    },
    async copy(s) {
      this.copyToClipboard('module-output')
      alert('Copied!');
    },

    copyToClipboard(id) {
      var r = document.createRange();
      r.selectNode(document.getElementById(id));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(r);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
    },

    /**
     * module "json_vars_parser" {
        source = "yurymkomarov/terraform-local-json-vars-parser"
        custom_vars = file("${path.root}/../vars.json")
      }
     */
    buildModulesFromJson(json) {
      const alignSpaces = true;

      let moduleMap = json.map(module => {
        let output = `module "${module.name}" {\n`;
        output += `\tsource = "${module.source}"\n\n`;

        let maxlength = module.variables.length > 0 ? module.variables.reduce((p, v) => (p > v.length? p: v.length)): 0;
        for (let variable of module.variables) {
          let spacePos = maxlength+5;
          let fill = alignSpaces? Array(spacePos - variable.length).fill('\xa0').join('') : ' ';

          output += `\t${variable}${fill}= var.${variable}\n`;
        }
        output += "}\n";
        return output;
      })

      return moduleMap.join("\n");
    },

    getGitUrl(gitConfigPath) {
      if (fs.existsSync(gitConfigPath)) {

        let gitUrl = null
        const data = fs.readFileSync(gitConfigPath, 'utf8')
        gitUrl = data.split("\n").find(l => l.includes('url = '))

        return gitUrl !== null ? gitUrl.replace('url = ', '').trim() : null;

      } else {
        console.log("File not found: ", gitConfigPath);
        return null
      }
    },

    getAllFilesRecursive(directory) {
      const skipHiddenFolders = true;
      let files = [];

      const getFilesRecursively = (directory) => {
        const filesInDirectory = fs.readdirSync(directory);
        for (const file of filesInDirectory) {
          const absolute = Path.join(directory, file);
          if (fs.statSync(absolute).isDirectory()) {
            if(!(file.startsWith('.') && skipHiddenFolders)) {
              getFilesRecursively(absolute);
            }
          } else {
            files.push(absolute);
          }
        }

      };
      getFilesRecursively(directory)

      return files;
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
