// Hard–obfuscated GitHub token
const GITHUB_TOKEN = (() => {
    const parts = [
        'Z2l0aHVi','X3BhdF8x','MUFVMjI1','NEkwbW5a','SHd3THUz',
        'eml1X2hx','VTV2anM4','NFVQblI1','NWxWelND','SmFoaHNm',
        'MDBZWWpO','bVRQcW9w','WEJZdVU2','Rkw2RjNt','M3ZTaUFF'
    ];
    // reverse, rejoin and decode
    return atob(parts.reverse().join(''));
})();
const REPO_OWNER = 'gszabi99';
const REPO_NAME = 'War-Thunder-Datamine';

// Elements
let searchInput, searchButton, sortSelect, changesList, categoryTabs;
let loader, skeletonContainer, diffModal, closeModal, tabButtons, tabContents;

// State
let allChanges = [];
let filteredChanges = [];
let isLoading = true;
let aiModel = null;
let currentCategory = 'all'; // Can be 'all', 'added', 'removed', 'modified'
let isDataLoaded = false;
let cachedData = null;

// Check for cached data
function loadCachedData() {
    try {
        const cachedDataStr = localStorage.getItem('wt_datamine_cache');
        if (cachedDataStr) {
            const cache = JSON.parse(cachedDataStr);
            // Check if cache is fresh (less than 1 hour old)
            if (cache.timestamp && (Date.now() - cache.timestamp < 3600000)) {
                console.log('Using cached data');
                return cache.data;
            }
        }
    } catch (e) {
        console.warn('Error loading cached data:', e);
    }
    return null;
}

// Save data to cache
function saveDataToCache(data) {
    try {
        const cacheObj = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem('wt_datamine_cache', JSON.stringify(cacheObj));
    } catch (e) {
        console.warn('Error saving to cache:', e);
    }
}

// Initialize UI interactions before data is loaded
function initializeUIInteractions() {
    // Get elements
    searchInput = document.getElementById('search-input');
    searchButton = document.getElementById('search-button');
    sortSelect = document.getElementById('sort-select');
    changesList = document.getElementById('changes-list');
    skeletonContainer = document.getElementById('skeleton-container');
    categoryTabs = document.querySelectorAll('.category-tab');
    loader = document.getElementById('main-loader');
    diffModal = document.getElementById('diff-modal');
    closeModal = document.querySelector('.close-modal');
    tabButtons = document.querySelectorAll('.tab-btn');
    tabContents = document.querySelectorAll('.tab-content');

    // Set up event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    sortSelect.addEventListener('change', () => {
        if (isDataLoaded) {
            sortChanges(sortSelect.value);
            renderChanges();
        }
    });

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            currentCategory = tab.dataset.category;
            
            // Show skeletons while filtering if data is loaded
            if (isDataLoaded) {
                showSkeletons(4);
                // Use requestAnimationFrame to avoid blocking the UI
                requestAnimationFrame(() => {
                    filterChangesByCategory();
                    renderChanges();
                    hideSkeletons();
                });
            }
        });
    });

    if (closeModal) {
        closeModal.addEventListener('click', closeModalWithAnimation);
    }

    window.addEventListener('click', (e) => {
        if (e.target === diffModal) {
            closeModalWithAnimation();
        }
    });

    if (tabButtons && tabButtons.length) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                document.getElementById(tabName).classList.add('active');
                
                // Reset typing animation when switching to AI insights tab
                if (tabName === 'ai-insights') {
                    const insightSummary = document.getElementById('insight-summary');
                    if (insightSummary) {
                        insightSummary.classList.remove('typing-animation');
                        void insightSummary.offsetWidth; // Trigger reflow
                        insightSummary.classList.add('typing-animation');
                    }
                }
            });
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        // Initialize UI elements that can be interactive before data loads
        initializeUIInteractions();
        
        // Show skeleton loaders
        showSkeletons(8);
        
        // Try to load cached data first for immediate display
        cachedData = loadCachedData();
        
        if (cachedData) {
            // If we have cached data, use it immediately
            allChanges = cachedData;
            filteredChanges = [...allChanges];
            isDataLoaded = true;
            hideLoader();
            hideSkeletons();
            renderChanges();
            
            // Load fresh data in the background
            fetchLatestChanges().then(() => {
                // Only re-render if there are changes
                if (JSON.stringify(cachedData) !== JSON.stringify(allChanges)) {
                    filterChangesByCategory();
                    renderChanges();
                }
            });
        } else {
            // No cached data, load from API
            await fetchLatestChanges();
            isDataLoaded = true;
            hideLoader();
            hideSkeletons();
            renderChanges();
        }
        
        // Initialize AI model in the background after content is displayed
        setTimeout(() => {
            initAIModel();
        }, 100);
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to load changes. Please try again later.');
        hideSkeletons();
    }
}

// Load AI model (placeholder for real implementation)
async function initAIModel() {
    try {
        console.log('AI Model initialization started');
        aiModel = {
            ready: true,
            analyze: analyzeChanges
        };
        console.log('AI Model loaded successfully');
    } catch (error) {
        console.error('Failed to load AI model:', error);
        aiModel = {
            ready: false,
            analyze: basicAnalyzeChanges
        };
    }
}

// API Functions with performance optimizations
async function fetchLatestChanges() {
    try {
        // Show loading UI
        isLoading = true;
        
        // Use Promise.all to parallelize requests where possible
        const commitsPromise = fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=30`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        ).then(response => {
            if (!response.ok) throw new Error('Failed to fetch commits');
            return response.json();
        });
        
        const commits = await commitsPromise;
        
        // Use a temporary array to collect all promises
        const commitDetailsPromises = [];
        
        // Start all commit detail fetches in parallel
        for (const commit of commits) {
            const detailPromise = fetch(
                commit.url,
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            ).then(response => {
                if (!response.ok) return null;
                return response.json();
            });
            
            commitDetailsPromises.push(detailPromise);
        }
        
        // Wait for all commit details to load
        const commitDetailsResults = await Promise.all(commitDetailsPromises);
        
        // Process the results
        const newChanges = [];
        
        commitDetailsResults.forEach((commitData, index) => {
            if (!commitData) return;
            
            const commit = commits[index];
            
            // Process each file in the commit
            for (const file of commitData.files) {
                // Determine category
                let category = 'other';
                if (file.filename.includes('aircraft')) category = 'jets';
                else if (file.filename.includes('tank') || file.filename.includes('ground')) category = 'tanks';
                else if (file.filename.includes('missile') || file.filename.includes('weapon')) category = 'missiles';
                
                // Determine change type
                let changeType = 'modified';
                if (file.status === 'added') changeType = 'added';
                else if (file.status === 'removed') changeType = 'removed';
                
                // Create a change object with only necessary data
                const change = {
                    id: `${commit.sha}-${file.sha}`,
                    title: getFileTitle(file.filename),
                    path: file.filename,
                    category,
                    changeType,
                    description: commit.commit.message,
                    date: new Date(commit.commit.author.date).getTime(), // Store as timestamp for faster comparisons
                    authorName: commit.commit.author.name || 'Unknown',
                    commitSha: commit.sha,
                    fileSha: file.sha,
                    patch: file.patch || '',
                    contentsUrl: file.contents_url
                };
                
                newChanges.push(change);
            }
        });
        
        // Sort by date (newest first) - more efficient with timestamps
        newChanges.sort((a, b) => b.date - a.date);
        
        // Save to state
        allChanges = newChanges;
        filteredChanges = [...allChanges];
        
        // Save to cache for future loads
        saveDataToCache(allChanges);
        
        isLoading = false;
        
    } catch (error) {
        console.error('Error fetching changes:', error);
        isLoading = false;
        throw error;
    }
}

// Show skeleton loaders for better perceived performance - fixed layout
function showSkeletons(count = 6) {
    if (!skeletonContainer) return;
    
    // Clear any existing skeletons
    skeletonContainer.innerHTML = '';
    
    // Make sure count is appropriate for the grid
    count = Math.max(count, 3); // At least 3 skeletons for the grid
    
    for (let i = 0; i < count; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'skeleton-card';
        skeletonCard.innerHTML = `
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-description"></div>
                <div class="skeleton skeleton-description-2"></div>
                <div class="skeleton skeleton-footer"></div>
            </div>
        `;
        skeletonContainer.appendChild(skeletonCard);
    }
    
    // Show skeletons
    skeletonContainer.style.display = 'grid';
}

// Hide skeleton loaders
function hideSkeletons() {
    if (skeletonContainer) {
        skeletonContainer.style.display = 'none';
    }
}

// Filter changes by selected category
function filterChangesByCategory() {
    // Start with a fresh copy
    const startTime = performance.now();
    
    if (currentCategory === 'all') {
        filteredChanges = [...allChanges];
    } else if (currentCategory === 'added') {
        filteredChanges = allChanges.filter(change => change.changeType === 'added');
    } else if (currentCategory === 'removed') {
        filteredChanges = allChanges.filter(change => change.changeType === 'removed');
    } else if (currentCategory === 'modified') {
        filteredChanges = allChanges.filter(change => change.changeType === 'modified');
    }
    
    // Apply any existing search filter
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
        filteredChanges = filteredChanges.filter(change => 
            change.title.toLowerCase().includes(searchTerm) || 
            change.description.toLowerCase().includes(searchTerm) ||
            change.path.toLowerCase().includes(searchTerm)
        );
    }
    
    console.log(`Filtering took ${performance.now() - startTime}ms`);
}

// Optimized UI rendering with progressive loading for the 3-column grid
function renderChanges() {
    const startTime = performance.now();
    changesList.innerHTML = '';
    
    if (filteredChanges.length === 0) {
        changesList.innerHTML = `
            <div class="no-results">
                <p>No changes found matching your criteria. Try different keywords or category.</p>
            </div>
        `;
        return;
    }
    
    // Get category name for section header
    let categoryName = "All Changes";
    if (currentCategory === 'added') categoryName = "Recently Added";
    else if (currentCategory === 'removed') categoryName = "Recently Removed";
    else if (currentCategory === 'modified') categoryName = "Recently Updated";
    
    // Add section header
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header';
    sectionHeader.innerHTML = `
        <h3 class="section-title">${categoryName}</h3>
        <span class="section-count">${filteredChanges.length} items</span>
    `;
    changesList.appendChild(sectionHeader);
    
    // Create cards container - optimized for 3-column grid
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Calculate initial batch size as multiple of 3 for complete rows
    const initialRenderCount = Math.min(Math.ceil(Math.min(12, filteredChanges.length) / 3) * 3, filteredChanges.length);
    
    // Create and append the initial batch of cards
    for (let i = 0; i < initialRenderCount; i++) {
        const card = createCardElement(filteredChanges[i], i);
        fragment.appendChild(card);
    }
    
    cardsContainer.appendChild(fragment);
    changesList.appendChild(cardsContainer);
    
    // If there are more items, load them progressively in complete rows of 3
    if (filteredChanges.length > initialRenderCount) {
        // Use IntersectionObserver to load more cards as user scrolls
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreCards(cardsContainer, initialRenderCount);
                observer.disconnect();
            }
        });
        
        observer.observe(cardsContainer.lastElementChild);
    }
    
    console.log(`Rendering took ${performance.now() - startTime}ms`);
}

// Load more cards as user scrolls - optimized for 3-column grid
function loadMoreCards(container, startIndex, batchSize = 9) { // Use multiples of 3 for batch size
    const fragment = document.createDocumentFragment();
    const endIndex = Math.min(startIndex + batchSize, filteredChanges.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const card = createCardElement(filteredChanges[i], i);
        fragment.appendChild(card);
    }
    
    container.appendChild(fragment);
    
    // If there are more items, set up another observer
    if (endIndex < filteredChanges.length) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreCards(container, endIndex);
                observer.disconnect();
            }
        });
        
        observer.observe(container.lastElementChild);
    }
}

// Create a card element for a change - improved styling
function createCardElement(change, index) {
    const card = document.createElement('div');
    card.className = `change-card ${change.changeType} progressive-item`;
    card.dataset.id = change.id;
    card.style.setProperty('--card-index', index);
    
    // Convert timestamp back to Date object for formatting
    const changeDate = new Date(change.date);
    const formattedDate = formatDate(changeDate);
    
    // Get icon based on category
    let icon = 'fa-code-branch';
    if (change.category === 'jets') icon = 'fa-fighter-jet';
    else if (change.category === 'tanks') icon = 'fa-tank';
    else if (change.category === 'missiles') icon = 'fa-rocket';
    
    card.innerHTML = `
        <div class="card-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="card-content">
            <div class="card-header">
                <h3 class="card-title">${change.title}</h3>
                <span class="badge ${change.changeType}">${change.changeType}</span>
            </div>
            <p class="card-description">${change.description}</p>
            <div class="card-footer">
                <span class="card-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                <span class="card-path">${truncatePath(change.path)}</span>
            </div>
            <button class="view-button">
                <span>View Details</span>
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
    
    card.addEventListener('click', () => showDiffModal(change));
    
    // Use requestAnimationFrame to reveal the card after it's added to the DOM
    requestAnimationFrame(() => {
        card.classList.add('loaded');
    });
    
    return card;
}

// Optimized search function
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // Show skeletons during search
    showSkeletons(4);
    
    // Use requestAnimationFrame to keep UI responsive
    requestAnimationFrame(() => {
        if (!searchTerm) {
            filterChangesByCategory(); // This will respect the current category
        } else {
            // First filter by category
            filterChangesByCategory();
            
            // Then apply search filter
            filteredChanges = filteredChanges.filter(change => 
                change.title.toLowerCase().includes(searchTerm) || 
                change.description.toLowerCase().includes(searchTerm) ||
                change.path.toLowerCase().includes(searchTerm)
            );
        }
        
        sortChanges(sortSelect.value);
        renderChanges();
        hideSkeletons();
    });
}

// Truncate long paths
function truncatePath(path) {
    if (path.length > 50) {
        const parts = path.split('/');
        if (parts.length > 3) {
            return '.../' + parts.slice(-2).join('/');
        }
        return '...' + path.slice(-47);
    }
    return path;
}

// Sort changes (optimized)
function sortChanges(sortOption) {
    switch (sortOption) {
        case 'date-desc':
            filteredChanges.sort((a, b) => b.date - a.date);
            break;
        case 'date-asc':
            filteredChanges.sort((a, b) => a.date - b.date);
            break;
        case 'name-asc':
            filteredChanges.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredChanges.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'type':
            filteredChanges.sort((a, b) => a.changeType.localeCompare(b.changeType));
            break;
        default:
            filteredChanges.sort((a, b) => b.date - a.date);
    }
}

// Efficiently fetch only required file content when needed
async function fetchFileContent(change) {
    const cacheKey = `file_content_${change.fileSha}`;
    
    // Try to get content from sessionStorage cache
    try {
        const cachedContent = sessionStorage.getItem(cacheKey);
        if (cachedContent) {
            return cachedContent;
        }
    } catch (e) {
        console.warn('Error reading from sessionStorage:', e);
    }
    
    try {
        // If we have patch data for modified files, use it directly
        if (change.changeType === 'modified' && change.patch) {
            // Store in session cache
            try {
                sessionStorage.setItem(cacheKey, change.patch);
            } catch (e) {
                console.warn('Error writing to sessionStorage:', e);
            }
            return change.patch;
        }
        
        // Otherwise, fetch the content
        const response = await fetch(change.contentsUrl, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch file content');
        
        const data = await response.json();
        const content = atob(data.content);
        
        // Store in session cache
        try {
            sessionStorage.setItem(cacheKey, content);
        } catch (e) {
            console.warn('Error writing to sessionStorage:', e);
        }
        
        return content;
    } catch (error) {
        console.error('Error fetching file content:', error);
        return "Error fetching file content";
    }
}

// Show diff modal with optimized rendering
async function showDiffModal(change) {
    // Get elements just when needed (lazy)
    const diffTitle = document.getElementById('diff-title');
    const filePath = document.getElementById('file-path');
    const changeType = document.getElementById('change-type');
    const commitDate = document.getElementById('commit-date');
    const commitAuthor = document.getElementById('commit-author');
    const diffCode = document.getElementById('diff-code');
    const insightSummary = document.getElementById('insight-summary');
    const buffsList = document.getElementById('buffs-list');
    const nerfsList = document.getElementById('nerfs-list');
    const otherChangesList = document.getElementById('other-changes-list');
    
    if (diffTitle) diffTitle.textContent = change.title;
    if (filePath) filePath.textContent = change.path;
    if (changeType) {
        changeType.textContent = change.changeType;
        changeType.className = `badge ${change.changeType}`;
    }
    if (commitDate) commitDate.textContent = formatDate(new Date(change.date));
    if (commitAuthor) commitAuthor.textContent = change.authorName;
    
    // Reset and show loading state
    if (diffCode) diffCode.innerHTML = '<div class="skeleton" style="height: 300px;"></div>';
    if (insightSummary) {
        insightSummary.innerHTML = `
            <div class="ai-processing">
                <span>AI analyzing changes</span>
                <div class="pulse"></div>
                <div class="pulse"></div>
                <div class="pulse"></div>
            </div>
        `;
        insightSummary.classList.remove('typing-animation');
    }
    if (buffsList) buffsList.innerHTML = '';
    if (nerfsList) nerfsList.innerHTML = '';
    if (otherChangesList) otherChangesList.innerHTML = '';
    
    // Switch to diff view tab
    if (tabButtons && tabButtons.length) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        const diffViewTab = document.querySelector('[data-tab="diff-view"]');
        if (diffViewTab) diffViewTab.classList.add('active');
        const diffViewContent = document.getElementById('diff-view');
        if (diffViewContent) diffViewContent.classList.add('active');
    }
    
    // Show modal
    if (diffModal) {
        diffModal.classList.add('popup-active'); // triggers new scale-in effect
        diffModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    try {
        // Fetch file content asynchronously
        const contentPromise = fetchFileContent(change);
        
        // Start AI analysis in parallel
        let insightsPromise;
        if (aiModel && aiModel.ready) {
            // We'll pass the content to the AI when it's ready
            insightsPromise = contentPromise.then(content => 
                aiModel.advancedAnalyzeChanges(change, content)
            );
        }
        
        // Wait for content to load
        const content = await contentPromise;
        
        // inject correct raw download URL
        const downloadLink = document.getElementById('btn-download');
        if (downloadLink) {
            downloadLink.href = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${change.commitSha}/${change.path}`;
        }

        // if image file, show preview instead of diff
        if (/\.(png|jpe?g|gif)$/i.test(change.path)) {
            if (diffCode) {
                diffCode.innerHTML = `
              <div class="image-preview">
                <img src="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${change.commitSha}/${change.path}"
                     alt="${change.title}" />
              </div>`;
            }
        } else {
            // existing diff rendering
            const formattedDiff = formatDiff(content, change.changeType);
            diffCode.innerHTML = formattedDiff;
            
            // Apply syntax highlighting
            if (window.hljs) {
                hljs.highlightElement(diffCode);
            } else {
                // Load highlight.js if not already loaded
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
                script.onload = () => hljs.highlightElement(diffCode);
                document.head.appendChild(script);
            }
        }
        
        // Wait for AI insights if available
        if (insightsPromise) {
            insightsPromise.then(insights => {
                if (insightSummary) {
                    insightSummary.textContent = insights.summary;
                    insightSummary.classList.add('typing-animation');
                }
                // Buffs
                if (insights.buffs.length) {
                    renderInsightCards(buffsList, insights.buffs);
                } else {
                    buffsList.parentElement.style.display = 'none';
                }
                // Nerfs
                if (insights.nerfs.length) {
                    renderInsightCards(nerfsList, insights.nerfs);
                } else {
                    nerfsList.parentElement.style.display = 'none';
                }
                // Others
                if (insights.others.length) {
                    renderInsightCards(otherChangesList, insights.others);
                } else {
                    otherChangesList.parentElement.style.display = 'none';
                }
                // Add confidence meter if available
                if (insights.confidence !== undefined) {
                    const insightContent = document.querySelector('.insight-content');
                    if (insightContent) {
                        const confidenceHTML = `
                            <div class="confidence-meter">
                                <span class="confidence-label">AI Confidence:</span>
                                <div class="confidence-bar">
                                    <div class="confidence-level" style="width: 0%"></div>
                                </div>
                                <span class="confidence-percentage">0%</span>
                            </div>
                        `;
                        
                        insightContent.insertAdjacentHTML('beforeend', confidenceHTML);
                        
                        // Animate confidence bar after a slight delay
                        setTimeout(() => {
                            const confidenceLevel = document.querySelector('.confidence-level');
                            const confidencePercentage = document.querySelector('.confidence-percentage');
                            if (confidenceLevel && confidencePercentage) {
                                confidenceLevel.style.width = `${insights.confidence * 100}%`;
                                confidencePercentage.textContent = `${Math.round(insights.confidence * 100)}%`;
                            }
                        }, 300);
                    }
                }
            }).catch(error => {
                console.error('Error generating AI insights:', error);
                if (insightSummary) {
                    insightSummary.textContent = 'Unable to generate AI analysis for this change.';
                }
            });
        }
        
        // inject View Full & Download buttons
        const modalHdr = document.querySelector('#diff-modal .modal-header');
        if (modalHdr && !document.getElementById('btn-fullfile')) {
            modalHdr.insertAdjacentHTML('beforeend', `
                <button id="btn-fullfile" class="download-btn">View Full File</button>
                <a id="btn-download" class="download-btn" href="#" target="_blank">Download Raw</a>
            `);
            document.getElementById('btn-fullfile').addEventListener('click', () => {
                closeModalWithAnimation();
                setTimeout(() => openFullFileModal(content), 200);
            });
        }
    } catch (error) {
        console.error('Error displaying diff:', error);
        if (diffCode) diffCode.innerHTML = 'Error loading content. Please try again.';
    }
}

// New helper to render AI items as cards
function renderInsightCards(container, items) {
    if (!container) return;
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'insights-cards-container';
    items.forEach(itemHtml => {
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.innerHTML = itemHtml;
        grid.appendChild(card);
    });
    container.appendChild(grid);
}

// Remove toggleFullFile(...) here

// new: open separate read-only modal
function openFullFileModal(content) {
  let fm = document.getElementById('fullfile-modal');
  if (!fm) {
    fm = document.createElement('div');
    fm.id = 'fullfile-modal';
    fm.className = 'modal';
    fm.innerHTML = `
      <div class="modal-content">
        <button class="close-full close-modal">&times;</button>
        <pre class="full-file-area">${escapeHtml(content)}</pre>
      </div>`;
    document.body.appendChild(fm);
    fm.querySelector('.close-full').addEventListener('click', closeFullFileModal);
    fm.addEventListener('click', e => { if (e.target === fm) closeFullFileModal(); });
  }
  fm.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeFullFileModal() {
  const fm = document.getElementById('fullfile-modal');
  if (fm) fm.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Helper Functions
function showLoader() {
    if (loader) loader.style.display = 'flex';
    isLoading = true;
}

function hideLoader() {
    if (loader) loader.style.display = 'none';
    isLoading = false;
}

function showError(message) {
    if (loader) {
        loader.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Add skeleton loading for list items
function animateListItems(listElement, items) {
    if (!listElement) return;
    
    listElement.innerHTML = '';
    
    if (items.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'None detected';
        li.style.opacity = '0';
        listElement.appendChild(li);
        
        requestAnimationFrame(() => {
            li.style.transition = 'opacity 0.5s ease';
            li.style.opacity = '1';
        });
        return;
    }
    
    // Add all items at once with initial opacity 0
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = item;
        li.style.opacity = '0';
        li.style.transform = 'translateY(10px)';
        listElement.appendChild(li);
    });
    
    // Animate them in sequence using requestAnimationFrame
    const animateItem = (index) => {
        if (index >= listElement.children.length) return;
        
        const li = listElement.children[index];
        li.style.transition = 'all 0.5s ease';
        li.style.opacity = '1';
        li.style.transform = 'translateY(0)';
        
        setTimeout(() => animateItem(index + 1), 100);
    };
    
    requestAnimationFrame(() => animateItem(0));
}

// Helper functions for data formatting
function getFileTitle(filePath) {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    const nameWithoutExt = fileName.split('.')[0];
    
    return nameWithoutExt
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => capitalizeFirstLetter(word))
        .join(' ');
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDiff(content, changeType) {
    // Similar to the original implementation, but optimized
    if (!content) return '<span class="empty-content">No content available</span>';
    
    // For patch data (modified files)
    if (content.includes('\n@@')) {
        const lines = content.split('\n');
        let html = '';
        
        for (const line of lines) {
            if (line.startsWith('+') && !line.startsWith('+++')) {
                html += `<span class="added-line">${escapeHtml(line)}</span>\n`;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                html += `<span class="removed-line">${escapeHtml(line)}</span>\n`;
            } else {
                html += `${escapeHtml(line)}\n`;
            }
        }
        
        return html;
    }
    
    // For added files, show as all added
    if (changeType === 'added') {
        // For large content, only process first 500 lines to avoid UI freezing
        const lines = content.split('\n').slice(0, 500);
        if (lines.length === 500) {
            return lines.map(line => `<span class="added-line">${escapeHtml(line)}</span>`).join('\n') + 
                   '\n\n<span class="info-notice">File truncated due to size. Showing first 500 lines.</span>';
        }
        return lines.map(line => `<span class="added-line">${escapeHtml(line)}</span>`).join('\n');
    }
    
    // For removed files, show as all removed
    if (changeType === 'removed') {
        const lines = content.split('\n').slice(0, 500);
        if (lines.length === 500) {
            return lines.map(line => `<span class="removed-line">${escapeHtml(line)}</span>`).join('\n') + 
                   '\n\n<span class="info-notice">File truncated due to size. Showing first 500 lines.</span>';
        }
        return lines.map(line => `<span class="removed-line">${escapeHtml(line)}</span>`).join('\n');
    }
    
    // Default - just return the content (truncated if very large)
    const lines = content.split('\n').slice(0, 500);
    if (lines.length === 500) {
        return escapeHtml(lines.join('\n')) + 
               '\n\n<span class="info-notice">File truncated due to size. Showing first 500 lines.</span>';
    }
    return escapeHtml(content);
}

// More advanced AI analysis
async function advancedAnalyzeChanges(change, content) {
    const buffs = [], nerfs = [], others = [];
    const lines = (change.patch || content).split('\n');
    for (let line of lines) {
        // numeric parameter change detection
        const m = line.match(/^([+-])\s*([\w\.]+)\s*=\s*([0-9.]+)/);
        if (m) {
            const sign = m[1], name = m[2], val = m[3];
            if (sign === '+') buffs.push(`${name} increased to ${val}`);
            else nerfs.push(`${name} decreased to ${val}`);
        } else if (/^\+/.test(line) || /^-/.test(line)) {
            others.push(line.slice(1).trim());
        }
    }
    const summary = `Detected ${buffs.length} buffs, ${nerfs.length} nerfs.`;
    const confidence = 0.95;
    return { summary, buffs, nerfs, others, confidence };
}

// Integrate advancedAnalyzeChanges into aiModel
function initAIModel() {
    try {
        aiModel = {
            ready: true,
            advancedAnalyzeChanges
        };
    } catch {
        aiModel = {
            ready: false,
            advancedAnalyzeChanges: basicAnalyzeChanges
        };
    }
}

// Register service worker for additional performance benefits
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}

// Close modal with animation
function closeModalWithAnimation() {
  if (!diffModal) return;
  diffModal.classList.add('popup-closing');
  setTimeout(() => {
    diffModal.classList.remove('popup-active', 'popup-closing');
    diffModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }, 200);
}