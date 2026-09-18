/**
 * Binary min-heap with an injectable comparator. Used by Dijkstra so that
 * ties resolve by the comparator (distance, then node ID), never by
 * insertion order.
 */
export class MinHeap<T> {
  private readonly items: T[] = [];

  constructor(private readonly compare: (left: T, right: T) => number) {}

  get size(): number {
    return this.items.length;
  }

  push(item: T): void {
    this.items.push(item);
    this.siftUp(this.items.length - 1);
  }

  pop(): T | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (last !== undefined && this.items.length > 0) {
      this.items[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  private less(i: number, j: number): boolean {
    const left = this.items[i];
    const right = this.items[j];
    return left !== undefined && right !== undefined && this.compare(left, right) < 0;
  }

  private swap(i: number, j: number): void {
    const left = this.items[i];
    const right = this.items[j];
    if (left !== undefined && right !== undefined) {
      this.items[i] = right;
      this.items[j] = left;
    }
  }

  private siftUp(start: number): void {
    let index = start;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (!this.less(index, parent)) {
        return;
      }
      this.swap(index, parent);
      index = parent;
    }
  }

  private siftDown(start: number): void {
    let index = start;
    for (;;) {
      const smallest = this.smallestChild(index);
      if (smallest === index) {
        return;
      }
      this.swap(index, smallest);
      index = smallest;
    }
  }

  private smallestChild(index: number): number {
    const left = 2 * index + 1;
    const right = left + 1;
    let smallest = index;
    if (left < this.items.length && this.less(left, smallest)) {
      smallest = left;
    }
    if (right < this.items.length && this.less(right, smallest)) {
      smallest = right;
    }
    return smallest;
  }
}
