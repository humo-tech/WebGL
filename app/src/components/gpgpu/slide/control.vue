<script setup>
const props = defineProps({
  isFloat: { type: Boolean, default: false },
})

const oppositeText = props.isFloat ? 'BYTES' : 'FLOAT'

const toggle = () => {
  location.href = props.isFloat ? '.' : '.?float'
}
</script>

<template>
  <div class="control">
    <button @click="toggle" class="button">{{ oppositeText }} テクスチャへ</button>
  </div>
</template>

<style scoped>
.control {
  position: absolute;
  bottom: 7px;
  right: 5px;
}

button {
  padding: 0;
  font-family: inherit;
  appearance: none;
  cursor: pointer;
  background-color: transparent;
  border: none;
}

button {
  background-color: #000;
  color: #999;
  border-radius: 4px;
  padding: 5px 10px;
  border: 1px solid #999;
  box-shadow: 0px 0px 3px #999;
  font-size: 10px;
  transition-duration: 0.3s;
}
button:hover {
  background-color: #eee;
  color: #333;
  transform: translate(-2px, -2px);
}
</style>
