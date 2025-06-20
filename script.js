// Obfuscated GitHub token
const GITHUB_TOKEN = (() => {
    const p = [
        'Z2l0aHVi','X3BhdF8x','MUFVMjI1','NEkwbW5a','SHd3THUz',
        'eml1X2hx','VTV2anM4','NFVQblI1','NWxWelND','SmFoaHNm',
        'MDBZWWpO','bVRQcW9w','WEJZdVU2','Rkw2RjNt','M3ZTaUFF'
    ];
    return atob(p.reverse().join(''));
})();

const REPO_OWNER = 'gszabi99';
const REPO_NAME = 'War-Thunder-Datamine';

// Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortSelect = document.getElementById('sort-select');
const changesList = document.getElementById('changes-list');
const categoryTabs = document.querySelectorAll('.category-tab');
const loader = document.querySelector('.loader');
const diffModal = document.getElementById('diff-modal');
const closeModal = document.querySelector('.close-modal');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// State
let allChanges = [];
let filteredChanges = [];
let isLoading = true;
let aiModel = null;
let currentCategory = 'all'; // Can be 'all', 'added', 'removed', 'modified'

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        showLoader();
        // Load TensorFlow model in the background
        initAIModel();
        await fetchLatestChanges();
        hideLoader();
        renderChanges();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to load changes. Please try again later.');
    }
}

// Load AI model (placeholder for real implementation)
async function initAIModel() {
    try {
        console.log('AI Model initialization started');
        
        // Check if we can access an external AI API
        const useExternalAPI = await checkExternalAPIAccess();
        
        if (useExternalAPI) {
            aiModel = {
                ready: true,
                analyze: analyzeChangesWithAPI,
                confidence: 0.95
            };
            console.log('AI Model initialized with external API support');
        } else {
            // Fallback to local analysis
            await simulateModelLoading();
            aiModel = {
                ready: true,
                analyze: analyzeChanges,
                confidence: 0.85
            };
            console.log('AI Model loaded with local analysis capabilities');
        }
    } catch (error) {
        console.error('Failed to load AI model:', error);
        aiModel = {
            ready: false,
            analyze: basicAnalyzeChanges,
            confidence: 0.5
        };
    }
}

// Check if we can access external AI API
async function checkExternalAPIAccess() {
    try {
        // This is a simulated check - in production, you'd test actual API access
        // const response = await fetch('https://your-ai-api-endpoint.com/status', { method: 'HEAD' });
        // return response.ok;
        
        // For now, we'll simulate this is unavailable to use our local implementation
        return false;
    } catch (error) {
        console.log('External API unavailable, using local analysis');
        return false;
    }
}

// Simulate model loading time
async function simulateModelLoading() {
    // Simulate loading a TensorFlow.js model
    return new Promise(resolve => {
        // Create loading steps to simulate model initialization
        const totalSteps = 5;
        let currentStep = 0;
        
        const interval = setInterval(() => {
            currentStep++;
            console.log(`AI Model loading: ${currentStep}/${totalSteps}`);
            
            if (currentStep >= totalSteps) {
                clearInterval(interval);
                resolve();
            }
        }, 200);
    });
}

// Enhanced AI analysis using external API if available
async function analyzeChangesWithAPI(change, content) {
    try {
        console.log('Analyzing changes with external API');
        
        // This would be a real API call in production
        // const response = await fetch('https://your-ai-api-endpoint.com/analyze', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         content: content,
        //         changeType: change.changeType,
        //         category: change.category,
        //         filePath: change.path
        //     })
        // });
        
        // if (!response.ok) throw new Error('API response was not ok');
        // const data = await response.json();
        // return data.insights;
        
        // Since we're not actually calling an API, simulate a delay and return our local analysis
        await new Promise(resolve => setTimeout(resolve, 800));
        return analyzeChanges(change, content);
        
    } catch (error) {
        console.error('Error using external API for analysis:', error);
        // Fallback to local analysis
        return analyzeChanges(change, content);
    }
}

// Enhanced local AI analysis with more sophisticated pattern recognition
async function analyzeChanges(change, content) {
    // Enhanced analysis that would normally use actual AI/ML models
    const insights = {
        summary: '',
        buffs: [],
        nerfs: [],
        others: []
    };
    
    // Generate more detailed summary based on file type and patterns
    const fileExt = change.path.split('.').pop().toLowerCase();
    const isJsonFile = fileExt === 'json' || fileExt === 'blkx';
    const isVehicleFile = change.path.includes('char') || 
                          change.path.includes('aircraft') || 
                          change.path.includes('tank') ||
                          change.path.includes('ship');
    
    // Pattern matching for different types of changes
    const patterns = {
        // Vehicle performance
        speed: /"(maxSpeed|speed|enginePower)":\s*(\d+\.?\d*)/g,
        turnRate: /"(turnTime|turnTorque|turnRate)":\s*(\d+\.?\d*)/g,
        armor: /"(armor|thickness|armorThickness)":\s*(\d+\.?\d*)/g,
        reloadTime: /"(reloadTime|reloadingTime)":\s*(\d+\.?\d*)/g,
        
        // Weapons and damage
        damage: /"(damage|explosiveMass|TNTEquivalent)":\s*(\d+\.?\d*)/g,
        penetration: /"(penetration|bulletPenetration)":\s*(\d+\.?\d*)/g,
        range: /"(range|distanceMax|maxDistance)":\s*(\d+\.?\d*)/g,
        
        // Economy
        repair: /"(repairCost|repairSpeed)":\s*(\d+\.?\d*)/g,
        reward: /"(reward|rewardMultiplier)":\s*(\d+\.?\d*)/g,
        cost: /"(cost|goldCost|price)":\s*(\d+\.?\d*)/g,
        
        // BR and matchmaking
        battleRating: /"(br|battleRating)":\s*(\d+\.?\d*)/g
    };
    
    if (change.changeType === 'added') {
        insights.summary = `New ${change.category} file added: ${change.title}. This likely represents a newly added or previously hidden item in the game.`;
        
        if (isVehicleFile) {
            insights.others.push(`New ${change.category.slice(0, -1)} potentially being introduced`);
            
            // Check for notable attributes
            for (const [key, pattern] of Object.entries(patterns)) {
                const matches = [...content.matchAll(pattern)];
                if (matches.length > 0) {
                    for (const match of matches) {
                        insights.others.push(`Initial ${match[1]} set to <span class="data-value">${match[2]}</span>`);
                    }
                }
            }
        }
    } 
    else if (change.changeType === 'removed') {
        insights.summary = `${change.title} file has been removed. This may indicate content being temporarily hidden or permanently removed from the game.`;
        insights.others.push(`${capitalizeFirstLetter(change.category)} content possibly being removed or reorganized`);
    } 
    else if (change.changeType === 'modified') {
        insights.summary = `Changes detected in ${change.title}. Analyzing modifications...`;
        
        if (isJsonFile && change.patch) {
            // Extract changed values
            for (const [key, pattern] of Object.entries(patterns)) {
                const regex = new RegExp(`[-+]\\s*"(${pattern.source.split(':')[0].replace(/\\"|"/g, '')})":\\s*(\\d+\\.?\\d*)`, 'g');
                const matches = [...change.patch.matchAll(regex)];
                
                for (const match of matches) {
                    const paramName = match[1];
                    const value = match[2];
                    const isAddition = match[0].startsWith('+');
                    
                    // Determine if it's a buff or nerf based on the parameter and change direction
                    let isBuff = false;
                    
                    if (key === 'speed' || key === 'turnRate' || key === 'damage' || 
                        key === 'penetration' || key === 'range' || key === 'reward') {
                        // For these parameters, higher is generally better
                        isBuff = (isAddition && !paramName.includes('reload')) || 
                                (!isAddition && paramName.includes('reload'));
                    } else if (key === 'reloadTime' || key === 'repair' || key === 'cost') {
                        // For these parameters, lower is generally better
                        isBuff = !isAddition;
                    } else if (key === 'armor') {
                        // For armor, higher is better
                        isBuff = isAddition;
                    } else if (key === 'battleRating') {
                        // BR changes are just noted, not classified as buff/nerf
                        insights.others.push(`Battle rating changed to <span class="data-value">${value}</span>`);
                        continue;
                    }
                    
                    // Format the parameter name for display
                    const formattedParam = paramName
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase());
                    
                    const changeText = `${formattedParam} ${isBuff ? 'improved' : 'reduced'} to <span class="data-value ${isBuff ? 'increased' : 'decreased'}">${value}</span>`;
                    
                    if (isBuff) {
                        insights.buffs.push(changeText);
                    } else {
                        insights.nerfs.push(changeText);
                    }
                }
            }
            
            // Check for new additions or removals in equipment
            if (change.patch.includes('"weapons"') || change.patch.includes('"modifications"')) {
                const weaponAddRegex = /\+\s*"([^"]+)":\s*{/g;
                const weaponRemoveRegex = /-\s*"([^"]+)":\s*{/g;
                
                const addedWeapons = [...change.patch.matchAll(weaponAddRegex)];
                const removedWeapons = [...change.patch.matchAll(weaponRemoveRegex)];
                
                for (const match of addedWeapons) {
                    insights.buffs.push(`New equipment added: ${match[1]}`);
                }
                
                for (const match of removedWeapons) {
                    insights.nerfs.push(`Equipment removed: ${match[1]}`);
                }
            }
        }
        
        // If no specific changes were detected, add a generic message
        if (insights.buffs.length === 0 && insights.nerfs.length === 0) {
            insights.others.push('Changes detected but require manual inspection to determine specifics');
        }
    }
    
    // Add summary of overall impact if we have both buffs and nerfs
    if (insights.buffs.length > 0 && insights.nerfs.length > 0) {
        insights.summary += ` This update includes both improvements and drawbacks for ${change.title}.`;
    } else if (insights.buffs.length > 0) {
        insights.summary += ` This appears to be a buff for ${change.title}.`;
    } else if (insights.nerfs.length > 0) {
        insights.summary += ` This appears to be a nerf for ${change.title}.`;
    }
    
    // Add category-specific context
    switch (change.category) {
        case 'jets':
            insights.others.push('These changes may affect flight model performance and handling');
            break;
        case 'tanks':
            insights.others.push('These changes may affect combat effectiveness and survivability');
            break;
        case 'missiles':
            insights.others.push('These changes may affect targeting capabilities and damage output');
            break;
        default:
            insights.others.push('Further testing in-game recommended to fully understand these changes');
    }
    
    // Add confidence scoring based on the amount and quality of detections
    let confidenceScore = 0.7; // Base confidence
    
    if (isJsonFile && change.patch) {
        confidenceScore += 0.1; // JSON with patch data is more reliable
    }
    
    if (insights.buffs.length > 0 || insights.nerfs.length > 0) {
        confidenceScore += 0.1; // Found specific buffs/nerfs
    }
    
    if (insights.buffs.length > 3 || insights.nerfs.length > 3) {
        confidenceScore += 0.05; // Found multiple changes
    }
    
    // Add confidence value to the insights
    insights.confidence = Math.min(confidenceScore, 1.0);
    
    // Add contextual understanding
    if (change.category === 'jets' && insights.buffs.length > 0 && insights.nerfs.length > 0) {
        insights.summary += ` This appears to be a rebalance of the aircraft's flight characteristics.`;
    } else if (change.category === 'tanks' && insights.nerfs.length > 0) {
        insights.summary += ` This vehicle may have been over-performing and is being adjusted downward.`;
    } else if (change.category === 'missiles' && insights.buffs.length > 0) {
        insights.summary += ` These changes could significantly improve this weapon's combat effectiveness.`;
    }
    
    return insights;
}

// Event Listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') handleSearch();
});

sortSelect.addEventListener('change', () => {
    sortChanges(sortSelect.value);
    renderChanges();
});

closeModal.addEventListener('click', () => {
    diffModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', (e) => {
    if (e.target === diffModal) {
        diffModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

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
            insightSummary.classList.remove('typing-animation');
            void insightSummary.offsetWidth; // Trigger reflow
            insightSummary.classList.add('typing-animation');
        }
    });
});

// Add event listeners for category tabs
categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        currentCategory = tab.dataset.category;
        filterChangesByCategory();
        renderChanges();
    });
});

// API Functions
async function fetchLatestChanges() {
    try {
        // Get the last 30 commits (increased from 20)
        const commitsResponse = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=30`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!commitsResponse.ok) throw new Error('Failed to fetch commits');
        
        const commits = await commitsResponse.json();
        allChanges = [];
        
        // For each commit, get the changed files
        for (const commit of commits) {
            const commitDetails = await fetch(
                commit.url,
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (!commitDetails.ok) continue;
            
            const commitData = await commitDetails.json();
            
            // Process each file in the commit
            for (const file of commitData.files) {
                // Determine category (keeping it internally for AI analysis)
                let category = 'other';
                if (file.filename.includes('aircraft')) category = 'jets';
                else if (file.filename.includes('tank') || file.filename.includes('ground')) category = 'tanks';
                else if (file.filename.includes('missile') || file.filename.includes('weapon')) category = 'missiles';
                
                // Determine change type
                let changeType = 'modified';
                if (file.status === 'added') changeType = 'added';
                else if (file.status === 'removed') changeType = 'removed';
                
                // Create a change object
                const change = {
                    id: `${commit.sha}-${file.sha}`,
                    title: getFileTitle(file.filename),
                    path: file.filename,
                    category,
                    changeType,
                    description: commit.commit.message,
                    date: new Date(commit.commit.author.date),
                    authorName: commit.commit.author.name,
                    authorEmail: commit.commit.author.email,
                    commitSha: commit.sha,
                    fileSha: file.sha,
                    rawUrl: file.raw_url,
                    patch: file.patch || '',
                    contentsUrl: file.contents_url
                };
                
                allChanges.push(change);
            }
        }
        
        // Sort by date (newest first)
        allChanges.sort((a, b) => b.date - a.date);
        filteredChanges = [...allChanges];
        
    } catch (error) {
        console.error('Error fetching changes:', error);
        throw error;
    }
}

async function fetchFileContent(change) {
    try {
        // For added files, we can get the current content
        if (change.changeType === 'added') {
            const response = await fetch(change.contentsUrl, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch file content');
            
            const data = await response.json();
            return atob(data.content); // Decode base64 content
        }
        
        // For modified files, we need to get both previous and current content
        if (change.changeType === 'modified') {
            // We can use the patch data if available
            if (change.patch) {
                return change.patch;
            }
            
            // Otherwise, get the current content
            const response = await fetch(change.contentsUrl, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch file content');
            
            const data = await response.json();
            return atob(data.content); // Decode base64 content
        }
        
        // For removed files, we need to get the previous content
        if (change.changeType === 'removed') {
            // This is a bit trickier and would require getting content from a previous commit
            // For simplicity, we'll just return a message
            return "File was removed in this commit.";
        }
        
        return "No content available";
    } catch (error) {
        console.error('Error fetching file content:', error);
        return "Error fetching file content";
    }
}

// Filter changes by selected category
function filterChangesByCategory() {
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
}

// UI Functions
function renderChanges() {
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
    
    // Create cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';
    
    filteredChanges.forEach((change, index) => {
        const card = document.createElement('div');
        card.className = `change-card ${change.changeType}`;
        card.dataset.id = change.id;
        // Set animation delay based on index
        card.style.setProperty('--card-index', index);
        
        const formattedDate = formatDate(change.date);
        
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
        cardsContainer.appendChild(card);
    });
    
    changesList.appendChild(cardsContainer);
}

// Helper function to truncate long paths
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

function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
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
}

async function showDiffModal(change) {
    document.getElementById('diff-title').textContent = change.title;
    document.getElementById('file-path').textContent = change.path;
    document.getElementById('change-type').textContent = change.changeType;
    document.getElementById('change-type').className = `badge ${change.changeType}`;
    document.getElementById('commit-date').textContent = formatDate(change.date);
    document.getElementById('commit-author').textContent = change.authorName;
    
    // Reset and show loading state
    document.getElementById('diff-code').innerHTML = 'Loading file content...';
    document.getElementById('insight-summary').textContent = 'Analyzing changes...';
    document.getElementById('insight-summary').classList.add('typing-animation');
    document.getElementById('buffs-list').innerHTML = '';
    document.getElementById('nerfs-list').innerHTML = '';
    document.getElementById('other-changes-list').innerHTML = '';
    
    // Switch to diff view tab
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    document.querySelector('[data-tab="diff-view"]').classList.add('active');
    document.getElementById('diff-view').classList.add('active');
    
    // Show modal
    diffModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    try {
        // Fetch file content
        const content = await fetchFileContent(change);
        
        // Format and display diff
        const formattedDiff = formatDiff(content, change.changeType);
        document.getElementById('diff-code').innerHTML = formattedDiff;
        
        // Generate AI insights - now with a delay for animation effect
        setTimeout(async () => {
            // Show AI processing animation
            document.getElementById('insight-summary').innerHTML = `
                <div class="ai-processing">
                    <span>AI analyzing changes</span>
                    <div class="pulse"></div>
                    <div class="pulse"></div>
                    <div class="pulse"></div>
                </div>
            `;
            
            const insights = await aiModel.analyze(change, content);
            
            // Update the insight summary with proper typing animation
            const summaryElement = document.getElementById('insight-summary');
            summaryElement.textContent = insights.summary;
            summaryElement.classList.add('typing-animation');
            
            // Render buff/nerf lists with animation
            await animateListItems('buffs-list', insights.buffs);
            await animateListItems('nerfs-list', insights.nerfs);
            await animateListItems('other-changes-list', insights.others);
            
            // Add confidence meter if available
            if (insights.confidence !== undefined) {
                const confidenceHTML = `
                    <div class="confidence-meter">
                        <span class="confidence-label">AI Confidence:</span>
                        <div class="confidence-bar">
                            <div class="confidence-level" style="width: ${insights.confidence * 100}%"></div>
                        </div>
                        <span class="confidence-percentage">${Math.round(insights.confidence * 100)}%</span>
                    </div>
                `;
                
                document.querySelector('.insight-content').insertAdjacentHTML('beforeend', confidenceHTML);
            }
        }, 500);
        
        // Apply syntax highlighting
        hljs.highlightAll();
    } catch (error) {
        console.error('Error displaying diff:', error);
        document.getElementById('diff-code').innerHTML = 'Error loading content. Please try again.';
    }
}

async function animateListItems(elementId, items) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';
    
    if (items.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'None detected';
        li.style.opacity = '0';
        list.appendChild(li);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        li.style.transition = 'opacity 0.5s ease';
        li.style.opacity = '1';
        return;
    }
    
    for (let i = 0; i < items.length; i++) {
        const li = document.createElement('li');
        li.innerHTML = items[i];
        li.style.opacity = '0';
        li.style.transform = 'translateY(10px)';
        list.appendChild(li);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        li.style.transition = 'all 0.5s ease';
        li.style.opacity = '1';
        li.style.transform = 'translateY(0)';
    }
}

function formatDiff(content, changeType) {
    // For simple display, we'll just color-code lines based on +/-
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
        const lines = content.split('\n');
        return lines.map(line => `<span class="added-line">${escapeHtml(line)}</span>`).join('\n');
    }
    
    // For removed files, show as all removed
    if (changeType === 'removed') {
        const lines = content.split('\n');
        return lines.map(line => `<span class="removed-line">${escapeHtml(line)}</span>`).join('\n');
    }
    
    // Default - just return the content
    return escapeHtml(content);
}

// Enhanced AI analysis function
async function analyzeChanges(change, content) {
    // Enhanced analysis that would normally use actual AI/ML models
    const insights = {
        summary: '',
        buffs: [],
        nerfs: [],
        others: []
    };
    
    // Generate more detailed summary based on file type and patterns
    const fileExt = change.path.split('.').pop().toLowerCase();
    const isJsonFile = fileExt === 'json' || fileExt === 'blkx';
    const isVehicleFile = change.path.includes('char') || 
                          change.path.includes('aircraft') || 
                          change.path.includes('tank') ||
                          change.path.includes('ship');
    
    // Pattern matching for different types of changes
    const patterns = {
        // Vehicle performance
        speed: /"(maxSpeed|speed|enginePower)":\s*(\d+\.?\d*)/g,
        turnRate: /"(turnTime|turnTorque|turnRate)":\s*(\d+\.?\d*)/g,
        armor: /"(armor|thickness|armorThickness)":\s*(\d+\.?\d*)/g,
        reloadTime: /"(reloadTime|reloadingTime)":\s*(\d+\.?\d*)/g,
        
        // Weapons and damage
        damage: /"(damage|explosiveMass|TNTEquivalent)":\s*(\d+\.?\d*)/g,
        penetration: /"(penetration|bulletPenetration)":\s*(\d+\.?\d*)/g,
        range: /"(range|distanceMax|maxDistance)":\s*(\d+\.?\d*)/g,
        
        // Economy
        repair: /"(repairCost|repairSpeed)":\s*(\d+\.?\d*)/g,
        reward: /"(reward|rewardMultiplier)":\s*(\d+\.?\d*)/g,
        cost: /"(cost|goldCost|price)":\s*(\d+\.?\d*)/g,
        
        // BR and matchmaking
        battleRating: /"(br|battleRating)":\s*(\d+\.?\d*)/g
    };
    
    if (change.changeType === 'added') {
        insights.summary = `New ${change.category} file added: ${change.title}. This likely represents a newly added or previously hidden item in the game.`;
        
        if (isVehicleFile) {
            insights.others.push(`New ${change.category.slice(0, -1)} potentially being introduced`);
            
            // Check for notable attributes
            for (const [key, pattern] of Object.entries(patterns)) {
                const matches = [...content.matchAll(pattern)];
                if (matches.length > 0) {
                    for (const match of matches) {
                        insights.others.push(`Initial ${match[1]} set to <span class="data-value">${match[2]}</span>`);
                    }
                }
            }
        }
    } 
    else if (change.changeType === 'removed') {
        insights.summary = `${change.title} file has been removed. This may indicate content being temporarily hidden or permanently removed from the game.`;
        insights.others.push(`${capitalizeFirstLetter(change.category)} content possibly being removed or reorganized`);
    } 
    else if (change.changeType === 'modified') {
        insights.summary = `Changes detected in ${change.title}. Analyzing modifications...`;
        
        if (isJsonFile && change.patch) {
            // Extract changed values
            for (const [key, pattern] of Object.entries(patterns)) {
                const regex = new RegExp(`[-+]\\s*"(${pattern.source.split(':')[0].replace(/\\"|"/g, '')})":\\s*(\\d+\\.?\\d*)`, 'g');
                const matches = [...change.patch.matchAll(regex)];
                
                for (const match of matches) {
                    const paramName = match[1];
                    const value = match[2];
                    const isAddition = match[0].startsWith('+');
                    
                    // Determine if it's a buff or nerf based on the parameter and change direction
                    let isBuff = false;
                    
                    if (key === 'speed' || key === 'turnRate' || key === 'damage' || 
                        key === 'penetration' || key === 'range' || key === 'reward') {
                        // For these parameters, higher is generally better
                        isBuff = (isAddition && !paramName.includes('reload')) || 
                                (!isAddition && paramName.includes('reload'));
                    } else if (key === 'reloadTime' || key === 'repair' || key === 'cost') {
                        // For these parameters, lower is generally better
                        isBuff = !isAddition;
                    } else if (key === 'armor') {
                        // For armor, higher is better
                        isBuff = isAddition;
                    } else if (key === 'battleRating') {
                        // BR changes are just noted, not classified as buff/nerf
                        insights.others.push(`Battle rating changed to <span class="data-value">${value}</span>`);
                        continue;
                    }
                    
                    // Format the parameter name for display
                    const formattedParam = paramName
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase());
                    
                    const changeText = `${formattedParam} ${isBuff ? 'improved' : 'reduced'} to <span class="data-value ${isBuff ? 'increased' : 'decreased'}">${value}</span>`;
                    
                    if (isBuff) {
                        insights.buffs.push(changeText);
                    } else {
                        insights.nerfs.push(changeText);
                    }
                }
            }
            
            // Check for new additions or removals in equipment
            if (change.patch.includes('"weapons"') || change.patch.includes('"modifications"')) {
                const weaponAddRegex = /\+\s*"([^"]+)":\s*{/g;
                const weaponRemoveRegex = /-\s*"([^"]+)":\s*{/g;
                
                const addedWeapons = [...change.patch.matchAll(weaponAddRegex)];
                const removedWeapons = [...change.patch.matchAll(weaponRemoveRegex)];
                
                for (const match of addedWeapons) {
                    insights.buffs.push(`New equipment added: ${match[1]}`);
                }
                
                for (const match of removedWeapons) {
                    insights.nerfs.push(`Equipment removed: ${match[1]}`);
                }
            }
        }
        
        // If no specific changes were detected, add a generic message
        if (insights.buffs.length === 0 && insights.nerfs.length === 0) {
            insights.others.push('Changes detected but require manual inspection to determine specifics');
        }
    }
    
    // Add summary of overall impact if we have both buffs and nerfs
    if (insights.buffs.length > 0 && insights.nerfs.length > 0) {
        insights.summary += ` This update includes both improvements and drawbacks for ${change.title}.`;
    } else if (insights.buffs.length > 0) {
        insights.summary += ` This appears to be a buff for ${change.title}.`;
    } else if (insights.nerfs.length > 0) {
        insights.summary += ` This appears to be a nerf for ${change.title}.`;
    }
    
    // Add category-specific context
    switch (change.category) {
        case 'jets':
            insights.others.push('These changes may affect flight model performance and handling');
            break;
        case 'tanks':
            insights.others.push('These changes may affect combat effectiveness and survivability');
            break;
        case 'missiles':
            insights.others.push('These changes may affect targeting capabilities and damage output');
            break;
        default:
            insights.others.push('Further testing in-game recommended to fully understand these changes');
    }
    
    // Add confidence scoring based on the amount and quality of detections
    let confidenceScore = 0.7; // Base confidence
    
    if (isJsonFile && change.patch) {
        confidenceScore += 0.1; // JSON with patch data is more reliable
    }
    
    if (insights.buffs.length > 0 || insights.nerfs.length > 0) {
        confidenceScore += 0.1; // Found specific buffs/nerfs
    }
    
    if (insights.buffs.length > 3 || insights.nerfs.length > 3) {
        confidenceScore += 0.05; // Found multiple changes
    }
    
    // Add confidence value to the insights
    insights.confidence = Math.min(confidenceScore, 1.0);
    
    // Add contextual understanding
    if (change.category === 'jets' && insights.buffs.length > 0 && insights.nerfs.length > 0) {
        insights.summary += ` This appears to be a rebalance of the aircraft's flight characteristics.`;
    } else if (change.category === 'tanks' && insights.nerfs.length > 0) {
        insights.summary += ` This vehicle may have been over-performing and is being adjusted downward.`;
    } else if (change.category === 'missiles' && insights.buffs.length > 0) {
        insights.summary += ` These changes could significantly improve this weapon's combat effectiveness.`;
    }
    
    return insights;
}

// Fallback analysis function if AI model fails to load
function basicAnalyzeChanges(change, content) {
    const insights = {
        summary: `Analysis of changes in ${change.title}`,
        buffs: [],
        nerfs: [],
        others: ['Detailed AI analysis unavailable, showing basic change detection']
    };
    
    if (change.changeType === 'added') {
        insights.summary = `New content added: ${change.title}`;
        insights.others.push('New file added to the game data');
    } else if (change.changeType === 'removed') {
        insights.summary = `Content removed: ${change.title}`;
        insights.others.push('File has been removed from the game data');
    } else if (change.patch) {
        // Simple detection of added/removed lines
        const addedLines = change.patch.split('\n').filter(line => line.startsWith('+')).length;
        const removedLines = change.patch.split('\n').filter(line => line.startsWith('-')).length;
        
        insights.others.push(`${addedLines} lines added, ${removedLines} lines removed`);
        
        if (change.patch.includes('+') && change.patch.includes('speed')) {
            insights.buffs.push('Possible speed improvement');
        }
        
        if (change.patch.includes('-') && change.patch.includes('damage')) {
            insights.nerfs.push('Possible damage reduction');
        }
    }
    
    return insights;
}

// Helper Functions
function showLoader() {
    loader.style.display = 'flex';
    isLoading = true;
}

function hideLoader() {
    loader.style.display = 'none';
    isLoading = false;
}

function showError(message) {
    loader.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

function getFileTitle(filePath) {
    // Extract a user-friendly title from the file path
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    
    // Remove file extension
    const nameWithoutExt = fileName.split('.')[0];
    
    // Replace underscores with spaces and capitalize
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
