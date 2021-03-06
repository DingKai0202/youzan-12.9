import './cart_base.css'
import './cart_trade.css'
import './cart.css'

import Vue from 'vue'
import url from 'js/api.js'
import axios from 'axios'
import mixin from 'js/mixin.js'
import Cart from 'js/cartService.js'

new Vue({
  el: '.container',
  mixins: [mixin],
  data () {
    return {
      lists: [],
      total: 0,
      editingShop: null,
      editingShopIndex: -1,
      removePopup: false,
      removeData: null,
      removeMsg: null
    }
  },
  computed: {
    allSelected: {
      get () {
        if (this.lists && this.lists.length) {
          return this.lists.every(shop => {
            return shop.checked
          })
        }
      },
      set (newVal) {
        this.lists.forEach(shop => {
          shop.checked = newVal
          shop.goodsList.forEach(good => {
            good.checked = newVal
          })
        })
      }
    },
    selectLists () {
      if (this.lists && this.lists.length) {
        let arr = {}
        arr.total = 0
        arr.lists = []
        this.lists.forEach(shop => {
          shop.goodsList.forEach(good => {
            if (good.checked) {
              arr.lists.push(good)
              arr.total += good.price * good.number
            }
          })
        })
        return arr
      }
      return []
    },
    removeLists () {
      if (this.editingShop) {
        let arr = []
        this.editingShop.goodsList.forEach(good => {
          if (good.removeChecked) {
            arr.push(good)
          }
        })
        return arr
      }
      return []
    },
    allRemoveSelected: {
      get () {
        if (this.editingShop) {
          return this.editingShop.removeChecked
        }
        return false
      },
      set (newVal) {
        if (this.editingShop) {
          this.editingShop.removeChecked = newVal
          this.editingShop.goodsList.forEach(good => {
            good.removeChecked = newVal
          })
        }
      }
    }
  },
  created () {
    this.getList()
  },
  methods: {
    getList () {
      axios.get(url.cartLists).then(res => {
        let nlists = res.data.cartList
        nlists.forEach(shop => {
          shop.checked = true
          shop.removeChecked = false
          shop.editing = false
          shop.editingMsg = '编辑'
          shop.goodsList.forEach(good => {
            good.checked = true
            good.removeChecked = false
          })
        })
        this.lists = nlists
        console.log('lists', this.lists)
      })
    },
    selectGood (shop, good) {
      let attr = this.editingShop ? 'removeChecked' : 'checked'
      good[attr] = !good[attr]
      shop[attr] = shop.goodsList.every(good => {
        return good[attr]
      })
      console.log(this.lists)
    },
    selectShop (shop) {
      let attr = this.editingShop ? 'removeChecked' : 'checked'
      shop.goodsList.forEach(good => {
        good[attr] = !shop[attr]
      })
      shop[attr] = !shop[attr]
    },
    selectAll () {
      let attr = this.editingShop ? 'allRemoveSelected' : 'allSelected'
      this[attr] = !this[attr]
      console.log(this.total)
    },
    edit (shop, shopIndex) {
      shop.editing = !shop.editing
      shop.editingMsg = shop.editing ? '完成' : '编辑'
      this.lists.forEach((item, i) => {
        if (shopIndex !== i) {
          item.editing = false
          item.editingMsg = shop.editing ? '' : '编辑'
        }
      })
      this.editingShop = shop.editing ? shop : null
      this.editingShopIndex = shop.editing ? shopIndex : -1
    },
    reduce (good) {
      if (good.number === 1) return
      axios.post(url.cartReduce, {
        id: good.id,
        number: 1
      }).then(res => {
        good.number--
      })
    },
    add (good) {
      // axios.post(url.cartAdd, {
      //   id: good.id,
      //   number: 1
      // }).then(res => {
      //   good.number++
      // })
      Cart.add(good.id).then(res => {
        console.log(res)
        good.number++
      })
    },
    remove (shop, shopIndex, good, goodIndex) {
      this.removePopup = true
      this.removeData = {shop, shopIndex, good, goodIndex}
      this.removeMsg = '确定要删除该商品么?'
    },
    removeList () {
      this.removePopup = true
      this.removeMsg = `确定将所选${this.removeLists.length}个商品删除?`
    },
    removeConfirm () {
      if (this.removeMsg === '确定要删除该商品么?') {
        let {shop, shopIndex, good, goodIndex} = this.removeData
        axios.post(url.cartRemove, {
          id: good.id
        }).then(res => {
          shop.goodsList.splice(goodIndex, 1)
          console.log(this.lists)
          if (shop.goodsList.length === 0) {
            this.lists.splice(shopIndex, 1)
            this.removeShop()
          }
          this.removePopup = false
        })
      } else {
        let ids = []
        this.removeLists.forEach(good => {
          ids.push(good.id)
        })
        axios.post(url.cartMremove, {
          ids
        }).then(res => {
          let arr = []
          this.editingShop.goodsList.forEach(good => {
            let index = this.removeLists.findIndex(item => {
              return item.id === good.id
            })
            if (index === -1) {
              arr.push(good)
            }
          })
          if (arr.length) {
            this.editingShop.goodsList = arr
          } else {
            this.lists.splice(this.editingShopIndex, 1)
            this.removeShop()
            this.removePopup = false
          }
        })
      }
    },
    removeShop () {
      this.editingShop = null
      this.editingShopIndex = -1
      this.lists.forEach(shop => {
        shop.editing = false
        shop.editingMsg = '编辑'
      })
    },
    start (e, good) {
      good.startX = e.changedTouches[0].clientX
    },
    end (e, shopIndex, good, goodIndex) {
      let endX = e.changedTouches[0].clientX
      console.log(endX)
      // let left = '0'
      if (good.startX - endX > 100) {
        this.left = good.startX - endX
        this.$refs.good[goodIndex].style.left = '-60px'
      }
      if (endX - good.startX > 100) {
        let left = '0px'
        this.$refs.good[goodIndex].style.left = '0px'
      }
    }
  }
})
