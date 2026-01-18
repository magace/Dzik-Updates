/**
 * Modern Item Loader with Virtual Scrolling and Pagination
 * Drop-in replacement for slow table rendering
 */

class ItemLoader {
    constructor(options = {}) {
        this.currentPage = 1;
        this.perPage = options.perPage || 100;
        this.totalPages = 1;
        this.totalItems = 0;
        this.items = [];
        this.isLoading = false;
        
        // Virtual scrolling
        this.visibleRange = { start: 0, end: 50 };
        this.rowHeight = 40; // approximate row height in pixels
        
        this.init();
    }

    init() {
        this.setupPagination();
        this.setupVirtualScroll();
        this.loadItems(1);
    }

    async loadItems(page) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoader();
        
        try {
            // Get search parameters
            const formData = new FormData(document.getElementById('searchform'));
            formData.append('page', page);
            formData.append('perPage', this.perPage);
            
            const response = await fetch('api.php?action=get_items', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            this.items = data.items;
            this.totalItems = data.total;
            this.totalPages = data.pages;
            this.currentPage = page;
            
            this.renderItems();
            this.updatePaginationControls();
            
        } catch (error) {
            console.error('Error loading items:', error);
            this.showError('Failed to load items. Please try again.');
        } finally {
            this.isLoading = false;
            this.hideLoader();
        }
    }

    renderItems() {
        const tbody = document.getElementById('items-body');
        if (!tbody) return;
        
        // Clear existing content
        tbody.innerHTML = '';
        
        // Render visible items only (virtual scrolling)
        const fragment = document.createDocumentFragment();
        const start = this.visibleRange.start;
        const end = Math.min(this.visibleRange.end, this.items.length);
        
        for (let i = start; i < end; i++) {
            const item = this.items[i];
            const row = this.createItemRow(item, i);
            fragment.appendChild(row);
        }
        
        tbody.appendChild(fragment);
        
        // Update header and footer if first load
        if (this.currentPage === 1) {
            this.renderHeader();
            this.renderFooter();
        }
    }

    createItemRow(item, index) {
        const row = document.createElement('tr');
        row.className = `loc${item.itemLocation} item`;
        row.dataset.index = index;
        
        // Set data attributes for item manager
        row.setAttribute('drImage', item.itemImage);
        row.setAttribute('drID', item.itemId);
        row.setAttribute('dritemid', `itemid${item.itemId}`);
        row.setAttribute('draccount', item.accountLogin);
        row.setAttribute('dritemtype', item.itemType);
        row.setAttribute('drchar', item.charName);
        row.setAttribute('drmd5', item.itemMD5);
        row.setAttribute('drrealm', this.getRealmName(item.accountRealm));
        row.setAttribute('drname', item.itemName);
        
        // Get item stats
        const stats = this.getItemStats(item);
        
        // Build row HTML
        let html = '';
        
        // Show character name if searching
        if (document.getElementById('searchtext')?.value) {
            html += `<td class="text-left"><b>${this.escapeHtml(item.charName)}</b></td>`;
        }
        
        // Show appropriate columns based on item type
        const itemType = this.getItemDisplayType(item);
        
        if (itemType === 'torch' || itemType === 'anni') {
            if (itemType === 'torch') {
                html += `<td class="text-center"><b>${stats.class || 'unid'}</b></td>`;
            }
            html += `<td class="text-center"><b>${stats.stat || 'unid'}</b></td>`;
            html += `<td class="text-center"><b>${stats.res || 'unid'}</b></td>`;
            if (itemType === 'anni') {
                html += `<td class="text-center"><b>${stats.exp || 'unid'}</b></td>`;
            }
        } else {
            html += `<td class="text-center"><b>${stats.ed || '&nbsp;'}</b></td>`;
            html += `<td class="text-center"><b>${stats.sockets || '&nbsp;'}</b></td>`;
        }
        
        // Item name with tooltip
        const qualityColor = this.getQualityColor(item.itemQuality);
        const tooltip = this.createTooltipContent(item);
        
        html += `
            <td>
                <div class="${qualityColor} show-tooltip" title="${tooltip}">
                    <b>${this.escapeHtml(item.itemName)}</b>
                </div>
            </td>
        `;
        
        row.innerHTML = html;
        return row;
    }

    renderHeader() {
        const thead = document.getElementById('items-header');
        if (!thead) return;
        
        const isSearching = !!document.getElementById('searchtext')?.value;
        const itemType = this.getItemDisplayType(this.items[0] || {});
        
        let html = '<tr>';
        
        if (isSearching && itemType !== 'torch' && itemType !== 'anni') {
            html += '<th width="20%" class="text-left exocet"><strong>CHAR</strong></th>';
        }
        
        if (itemType === 'torch' || itemType === 'anni') {
            if (itemType === 'torch') {
                html += '<th width="15%" class="text-center exocet"><strong>CLASS</strong></th>';
            }
            html += '<th width="15%" class="text-center exocet"><strong>STAT</strong></th>';
            html += '<th width="15%" class="text-center exocet"><strong>RES</strong></th>';
            if (itemType === 'anni') {
                html += '<th width="15%" class="text-center exocet"><strong>EXP</strong></th>';
            }
        } else {
            html += '<th width="15%" class="text-center exocet"><strong>ED</strong></th>';
            html += '<th width="15%" class="text-center exocet"><strong>SOCKETS</strong></th>';
        }
        
        html += '<th width="*" class="exocet"><strong>NAME</strong></th>';
        html += '</tr>';
        
        thead.innerHTML = html;
    }

    renderFooter() {
        const tfoot = document.getElementById('items-footer');
        if (!tfoot) return;
        
        // Mirror header
        tfoot.innerHTML = document.getElementById('items-header').innerHTML;
    }

    getItemStats(item) {
        // This would ideally come from the server
        // For now, return empty stats
        return {
            ed: '',
            sockets: '',
            stat: '',
            res: '',
            exp: '',
            class: ''
        };
    }

    getItemDisplayType(item) {
        // Determine what type of columns to show
        if (item.itemQuality === 7 && item.itemClassid === 604) return 'torch';
        if (item.itemQuality === 7 && item.itemClassid === 603) return 'anni';
        return 'normal';
    }

    getQualityColor(quality) {
        const colors = ['', 'colorb', 'colorb', 'colorb', 'color3', 'color2', 'color9', 'color4', 'color8'];
        return colors[quality] || '';
    }

    getRealmName(realmId) {
        const realms = ['uswest', 'useast', 'asia', 'europe', 'resurrected'];
        return realms[realmId] || 'useast';
    }

    createTooltipContent(item) {
        const imgPath = `images/items/${item.itemImage}.png`;
        const desc = this.escapeHtml(item.itemDescription);
        return `<center>&lt;img src=&quot;${imgPath}&quot;&gt;<br>${desc}</center>`;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    setupPagination() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.loadItems(this.currentPage - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.loadItems(this.currentPage + 1);
                }
            });
        }
    }

    updatePaginationControls() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages} (${this.totalItems} items)`;
        }
    }

    setupVirtualScroll() {
        const table = document.getElementById('itemstable');
        if (!table) return;
        
        // Implement virtual scrolling for large datasets
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateVisibleRange();
            }, 50);
        });
    }

    updateVisibleRange() {
        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        
        const start = Math.floor(scrollTop / this.rowHeight);
        const end = start + Math.ceil(viewportHeight / this.rowHeight) + 10; // Buffer
        
        if (start !== this.visibleRange.start || end !== this.visibleRange.end) {
            this.visibleRange = { start, end };
            this.renderItems();
        }
    }

    showLoader() {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.style.display = 'block';
    }

    hideLoader() {
        const loader = document.getElementById('loading-indicator');
        if (loader) loader.style.display = 'none';
    }

    showError(message) {
        const tbody = document.getElementById('items-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="alert alert-danger">
                            <strong>Error:</strong> ${message}
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    // Public API
    refresh() {
        this.loadItems(this.currentPage);
    }

    search(query) {
        // Trigger search and load first page
        this.loadItems(1);
    }

    setPerPage(perPage) {
        this.perPage = perPage;
        this.loadItems(1);
    }
}

// Initialize on page load
let itemLoader;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        itemLoader = new ItemLoader({ perPage: 100 });
    });
} else {
    itemLoader = new ItemLoader({ perPage: 100 });
}

// Expose for global access
window.ItemLoader = ItemLoader;
window.itemLoader = itemLoader;