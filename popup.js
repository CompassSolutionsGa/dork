document.getElementById('searchButton').addEventListener('click', function () {
    const domain = document.getElementById('domainInput').value.trim();
    const dorkType = document.getElementById('dorkType').value;
    const dateRange = document.getElementById('dateRange').value;

    if (domain) {
        let query;

        switch(dorkType) {
            case "basic":
                query = `"${domain}" -site:${domain}`;
                break;
            case "inurl":
                query = `"${domain}" -site:${domain} inurl:${domain}`;
                break;
            case "intext":
                query = `"${domain}" -site:${domain} intext:${domain}`;
                break;
            case "intitle":
                query = `"${domain}" -site:${domain} intitle:${domain}`;
                break;
            case "filetype":
                query = `"${domain}" -site:${domain} filetype:pdf`;
                break;
            case "site":
                query = `site:${domain}`;
                break;
            case "cache":
                query = `cache:${domain}`;
                break;
            case "related":
                query = `related:${domain}`;
                break;
            case "link":
                query = `link:${domain}`;
                break;
            case "inanchor":
                query = `"${domain}" -site:${domain} inanchor:${domain}`;
                break;
            case "allinurl":
                query = `allinurl:${domain}`;
                break;
            case "allintext":
                query = `allintext:${domain}`;
                break;
            case "allintitle":
                query = `allintitle:${domain}`;
                break;
            case "allinanchor":
                query = `allinanchor:${domain}`;
                break;
            case "filetypeAll":
                query = `"${domain}" -site:${domain} filetype:${domain}`;
                break;
            default:
                query = `"${domain}" -site:${domain}`;
        }

        if (dateRange) {
            query += ` after:${getDateRange(dateRange)}`;
        }

        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        // Delay opening the new window slightly to prevent the popup from closing too soon
        setTimeout(() => {
            chrome.windows.create({ url: url, type: 'popup' });
        }, 100);

        // Save the search to history
        chrome.storage.sync.get({ searchHistory: [] }, function(data) {
            let searchHistory = data.searchHistory;
            searchHistory.unshift({ domain, dorkType, id: Date.now() });
            if (searchHistory.length > 5) searchHistory.pop();
            chrome.storage.sync.set({ searchHistory }, function() {
                displayHistory();  // Ensure history is refreshed
            });
        });

    } else {
        alert("Please enter a valid domain.");
    }
});

// Function to convert date range to a format compatible with Google search
function getDateRange(range) {
    const today = new Date();
    let startDate;

    switch(range) {
        case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 1);
            break;
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'year':
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        default:
            startDate = today;
    }

    const year = startDate.getFullYear();
    const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
    const day = startDate.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Display search history on load
window.onload = function() {
    displayHistory();
};

function displayHistory() {
    chrome.storage.sync.get({ searchHistory: [] }, function(data) {
        const searchHistoryList = document.getElementById('searchHistoryList');
        searchHistoryList.innerHTML = '';
        data.searchHistory.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.dorkType}: ${item.domain}`;
            
            // Create a delete button for each item
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.className = 'deleteButton';
            deleteButton.addEventListener('click', function () {
                deleteSearch(item.id);
            });

            li.appendChild(deleteButton);
            searchHistoryList.appendChild(li);
        });

        // Check if the number of history items exceeds 4
        const container = document.getElementById('searchHistoryListContainer');
        if (data.searchHistory.length > 4) {
            container.style.overflowY = 'auto';  // Enable scroll bar
        } else {
            container.style.overflowY = 'hidden';  // Disable scroll bar
        }
    });
}

function deleteSearch(id) {
    chrome.storage.sync.get({ searchHistory: [] }, function(data) {
        const newHistory = data.searchHistory.filter(item => item.id !== id);
        chrome.storage.sync.set({ searchHistory: newHistory }, function() {
            displayHistory();
        });
    });
}

document.getElementById('clearAllButton').addEventListener('click', function () {
    chrome.storage.sync.set({ searchHistory: [] }, function() {
        displayHistory();
    });
});

// Export search history to CSV
document.getElementById('exportButton').addEventListener('click', function () {
    chrome.storage.sync.get({ searchHistory: [] }, function(data) {
        const searchHistory = data.searchHistory;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Dork Type,Domain\n";
        searchHistory.forEach(item => {
            csvContent += `${item.dorkType},${item.domain}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "search_history.csv");
        document.body.appendChild(link); // Required for FF

        link.click();
        link.remove();
    });
});
