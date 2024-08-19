document.getElementById('searchButton').addEventListener('click', function () {
    const domain = document.getElementById('domainInput').value.trim();
    const dorkType = document.getElementById('dorkType').value;
    const competitorDork = document.getElementById('competitorDorks').value;
    const dateRange = document.getElementById('dateRange').value;

    if (domain) {
        let query;

        if (competitorDork) {
            switch(competitorDork) {
                case "competitorBacklinks":
                    query = `"${domain}" -site:${domain} inurl:links`;
                    break;
                case "competitorIntext":
                    query = `"${domain}" -site:${domain} intext:${domain}`;
                    break;
            }
        } else {
            switch(dorkType) {
                case "basic":
                    query = `"${domain}" -site:${domain}`;
                    break;
                case "inurl":
                    query = `"${domain}" -site:${domain} inurl:links`;
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
                default:
                    query = `"${domain}" -site:${domain}`;
            }
        }

        if (dateRange) {
            query += ` after:${getDateRange(dateRange)}`;
        }

        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        chrome.tabs.create({ url });

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

function getDateRange(range) {
    const now = new Date();
    let pastDate;
    switch(range) {
        case 'yesterday':
            pastDate = new Date(now.setDate(now.getDate() - 1));
            break;
        case 'week':
            pastDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            pastDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'year':
            pastDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            return '';
    }
    return pastDate.toISOString().split('T')[0];
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
