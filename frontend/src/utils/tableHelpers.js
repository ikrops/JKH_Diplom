export const getValueByPath = (item, path) => {
    if (!path) return "";

    return path.split(".").reduce((current, key) => {
        if (current === null || current === undefined) return "";
        return current[key];
    }, item);
};

const normalize = (value) => String(value ?? "").toLowerCase().trim();

export const prepareTableData = (items, search, searchFields, sortBy, sortOrder = "asc") => {
    const query = normalize(search);

    const filtered = query
        ? items.filter((item) =>
            searchFields.some((field) => normalize(getValueByPath(item, field)).includes(query))
        )
        : [...items];

    if (!sortBy) {
        return filtered;
    }

    return filtered.sort((first, second) => {
        const firstValue = getValueByPath(first, sortBy);
        const secondValue = getValueByPath(second, sortBy);

        const firstNumber = Number(firstValue);
        const secondNumber = Number(secondValue);

        let result;
        if (!Number.isNaN(firstNumber) && !Number.isNaN(secondNumber) && firstValue !== "" && secondValue !== "") {
            result = firstNumber - secondNumber;
        } else {
            result = String(firstValue ?? "").localeCompare(String(secondValue ?? ""), "ru", {
                numeric: true,
                sensitivity: "base",
            });
        }

        return sortOrder === "desc" ? -result : result;
    });
};
