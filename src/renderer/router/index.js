import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/pages/LandingPage/LandingPage').default
    },
    {
      path: '/file-tools',
      name: 'file-tools',
      component: require('@/pages/FileTools').default
    },
    {
      path: '/code-generator',
      name: 'code-generator',
      component: require('@/pages/FileTools').default
    },
    {
      path: '/repo-setup',
      name: 'repo-setup',
      component: require('@/pages/FileTools').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
