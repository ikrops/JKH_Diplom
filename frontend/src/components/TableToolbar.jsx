function TableToolbar({
    search,
    onSearchChange,
    placeholder = "Поиск по таблице",
}) {
    return (
        <div className="table-toolbar">
            <input
                className="search-input"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

export default TableToolbar;
