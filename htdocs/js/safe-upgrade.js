/**
 * SAFE MINIMAL UPGRADE v2 - Fixed button loading state
 * Add this AFTER your existing itemManagerShow.js
 */

(function() {
    'use strict';
    
    // Only run if page is fully loaded
    if (document.readyState !== 'loading') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
    
    function init() {
        addSearchDebouncing();
        addLoadingIndicators();
        optimizeTooltips();
        addKeyboardShortcuts();
    }
    
    // 1. DEBOUNCED SEARCH - Wait for user to stop typing
    function addSearchDebouncing() {
        var searchInput = document.getElementById('searchtext');
        var searchButton = document.querySelector('.searchbut');
        
        if (!searchInput || !searchButton) return;
        
        var timeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            
            timeout = setTimeout(function() {
                // Auto-search after 500ms of no typing
                if (searchInput.value.length > 2) {
                    searchButton.click();
                }
            }, 500);
        });
    }
    
    // 2. BETTER LOADING INDICATORS - FIXED VERSION
    function addLoadingIndicators() {
        var loader = document.querySelector('.loader');
        var buttonStates = new Map();
        
        // Show loader during AJAX
        if (typeof jQuery !== 'undefined') {
            $(document).ajaxStart(function() {
                if (loader) loader.style.display = 'block';
            });
            
            $(document).ajaxStop(function() {
                if (loader) loader.style.display = 'none';
                
                // Reset ALL button states when AJAX completes
                buttonStates.forEach(function(originalText, btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                });
                buttonStates.clear();
            });
            
            $(document).ajaxError(function() {
                if (loader) loader.style.display = 'none';
                
                // Reset button states on error too
                buttonStates.forEach(function(originalText, btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                });
                buttonStates.clear();
            });
            
            // Button loading state with proper cleanup
            $(document).on('click', '.searchbut, .mainmenu, .submenu', function() {
                var btn = this;
                var originalText = btn.innerHTML;
                
                // Store original state
                buttonStates.set(btn, originalText);
                
                // Change to loading state
                btn.innerHTML = '<span class="glyphicon glyphicon-refresh spinning"></span> Loading...';
                btn.disabled = true;
                
                // Failsafe: restore after 10 seconds regardless
                setTimeout(function() {
                    if (buttonStates.has(btn)) {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        buttonStates.delete(btn);
                    }
                }, 10000);
            });
        }
    }
    
    // 3. LAZY LOAD TOOLTIPS - Only init when needed
    function optimizeTooltips() {
        if (typeof jQuery === 'undefined' || !jQuery.fn.tooltipster) return;
        
        // Delay tooltip initialization for better performance
        var tooltips = $('.show-tooltip:not(.tooltip-init)');
        var visibleTooltips = [];
        
        // Only init tooltips that are visible or near viewport
        tooltips.each(function() {
            var rect = this.getBoundingClientRect();
            if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
                visibleTooltips.push(this);
            }
        });
        
        // Init visible ones
        $(visibleTooltips).each(function() {
            var $el = $(this);
            if (!$el.hasClass('tooltip-init')) {
                var p = $el.parent();
                if (p.is('td')) {
                    $el.css('padding', p.css('padding'));
                    p.css('padding', '0 0');
                }
                
                $el.tooltipster({
                    delay: 0,
                    speed: 0,
                    touchDevices: false,
                    arrow: false,
                    position: "left",
                    interactive: true,
                    interactiveTolerance: 30,
                    contentAsHTML: true,
                    animation: 'fade',
                    trigger: 'hover'
                });
                
                $el.addClass('tooltip-init');
            }
        });
        
        // Init remaining on scroll (debounced)
        var scrollTimeout;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(optimizeTooltips, 200);
        }, { passive: true });
    }
    
    // 4. KEYBOARD SHORTCUTS
    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // / key = Focus search
            if (e.key === '/') {
                e.preventDefault();
                var search = document.getElementById('searchtext');
                if (search) search.focus();
            }
            
            // ESC = Clear selection
            if (e.key === 'Escape') {
                if (typeof ClearAll === 'function') {
                    ClearAll();
                }
            }
        });
    }
    
    // 5. ADD CSS FOR IMPROVEMENTS
    var style = document.createElement('style');
    style.textContent = `
        /* Spinning animation for loading */
        .spinning {
            display: inline-block;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        /* Smooth row highlighting */
        tr.item {
            transition: background-color 0.15s ease;
        }
        
        /* Improve selected item visibility */
        tr.selecteditem {
            background-color: #d9edf7 !important;
        }
        
        /* Better loading indicator */
        .loader {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            background: rgba(0,0,0,0.85);
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        
        /* Disabled button state */
        button:disabled, .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        /* Smooth button transitions */
        .btn {
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✓ Safe upgrades v2 loaded successfully');
})();