function SortableTh({ field, sortBy, sortOrder, onSort, children }) {
    const isActive = sortBy === field;
    const arrow = !isActive ? "↕" : sortOrder === "asc" ? "↑" : "↓";

    return (
        <th>
            <button
                type="button"
                className={`sortable-th ${isActive ? "active" : ""}`}
                onClick={() => onSort(field)}
                title="Нажмите для сортировки"
            >
                <span>{children}</span>
                <span className="sort-arrow">{arrow}</span>
            </button>
        </th>
    );
}

export default SortableTh;
