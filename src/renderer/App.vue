<script setup lang="ts">
import {onMounted, ref} from "vue";


const filePath = ref('')


function readFile() {
  console.log(globalThis.electronAPI)
  if (!filePath.value) {
    return
  }
  globalThis.electronAPI.sendMessage("read-file", filePath.value)
  // console.log(globalThis.electronAPI.sendMessage)
}

// onMounted(()=>{
//   ipcRenderer.on('file-contents', (event, data)=>{
//     console.log(data)
//   })
// })
</script>

<template>
  <div>
    <input v-model="filePath" placeholder="Enter file path"/>
    <button @click="readFile">Convert File</button>
  </div>
</template>