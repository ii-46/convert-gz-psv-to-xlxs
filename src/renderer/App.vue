<script setup lang="ts">
import {onMounted, ref} from "vue";

const logs = ref([])
const filePath = ref('')


function readFile() {
  console.log(globalThis.electronAPI)
  if (!filePath.value) {
    logs.value.push("Please enter a valid file path")
    return
  }
  globalThis.electronAPI.sendMessage("read-file", filePath.value)
}

onMounted(() => {
  globalThis.electronAPI.logsListen((data) => {
    logs.value.push(data)
  })
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <div class="flex gap-4 flex-col w-9/12">
      <input 
          class="bg-slate-100 rounded p-2 focus:outline-slate-700 focus:outline-2"
          v-model="filePath" 
          placeholder="Enter Folder Path"/>
      <button 
          class="p-3 bg-slate-600 text-white rounded font-bold active:bg-slate-700 transition duration-150"
          @click="readFile">
        Convert .gz Files to XLSX
      </button>

      <p>Logs</p>
      <div class="border-2 rounded border-slate-800 max-h-[200px] p-4 overflow-y-scroll">
        <div v-for="item in logs" class="border-b border-slate-300 m-0 pb-3" :key="item">{{ item }}</div>
      </div>
    </div>
  </div>
</template>