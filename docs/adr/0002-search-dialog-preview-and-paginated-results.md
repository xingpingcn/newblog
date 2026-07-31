# Use a Search Dialog for Preview and a Paginated Search Page for Full Results

The site header opens a same-page search dialog that previews at most 10 Pagefind results without changing the current URL. A separate `/search/?q=...&page=...` page remains the shareable, full-results surface with 20 results per page; this preserves a quick search flow while keeping deep links, refreshes, and large result sets predictable. Article titles and “查看详情” links stay in the current browser tab, while “查看全部搜索结果” closes the dialog and navigates to page one of the full-results view.

## Consequences

The dialog must manage focus, Escape, backdrop dismissal, and result-loading states. Search state typed into the dialog is intentionally not restored through browser history; the full-results URL is the persistence and sharing boundary.
