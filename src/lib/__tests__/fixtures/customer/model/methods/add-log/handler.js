module.exports = () => {
  return async function (message) {
    await this.$emit('logAdded', { message })
  }
}
