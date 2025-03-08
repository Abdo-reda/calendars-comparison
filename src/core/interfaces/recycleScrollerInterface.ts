export interface IRecycleScroller {
    $_lastUpdateScrollPosition: number,
    scrollToItem(index: number): void;
    scrollToPosition(position: number): void;
}
