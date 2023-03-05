function Stack () {
  this.top = Stack.Null;
}
Stack.prototype.push = function (data) {
  const node = new Stack.Node(data, this.top);
  this.top = node;

  return this;
}
Stack.prototype.pop = function () {
  if (this.top === Stack.Null) {
    return Stack.Null;
  }

  const node = this.top;
  this.top = node.next;

  return node.data;
}
Stack.Node = function (data, next) {
  this.data = data;
  this.next = next;
}
Stack.Null = { data: null };

module.exports = { Stack };
