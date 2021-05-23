<template>
  <div id="wrapper">
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a class="navbar-item">
          <img class="" src="~@/assets/terraform.png" alt="electron-vue" @click="$router.push('/')"/>
        </a>
        <div class="navbar-item">
          <h2>
            Terra Bros Tools
          </h2>
        </div>
      </div>
    </nav>
    <div id="app" class="container">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'terrabros-tools'
}
</script>

<style>
</style>
