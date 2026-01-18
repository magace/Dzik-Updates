<?php
/**
 * DATABASE OPTIMIZATION CHECKER
 * Returns true if database is optimized, false if not
 * Can be included in index.php to show optimization warning
 */

function isDatabaseOptimized() {
    try {
        $conn = new PDO('sqlite:ItemDB.s3db');
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $issues = [];
        
        // Check 1: Are indexes present?
        $indexes = $conn->query("SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND sql IS NOT NULL")->fetch();
        $indexCount = $indexes['count'];
        
        if ($indexCount < 8) {
            $issues[] = "Missing indexes ($indexCount found, need at least 8)";
        }
        
        // Check 2: Is WAL mode enabled?
        $walMode = $conn->query("PRAGMA journal_mode")->fetch()[0];
        if (strtolower($walMode) != 'wal') {
            $issues[] = "WAL mode not enabled (currently: $walMode)";
        }
        
        // Check 3: Cache size - SKIP THIS CHECK
        // Cache size resets per connection in SQLite, can't be made permanent
        // So we don't check it - it will always show as "not optimized"
        $cacheSize = abs(intval($conn->query("PRAGMA cache_size")->fetch()[0]));
        
        // Check 4: Has ANALYZE been run?
        $analyzeCheck = $conn->query("SELECT COUNT(*) as count FROM sqlite_stat1")->fetch();
        if ($analyzeCheck['count'] == 0) {
            $issues[] = "Database not analyzed (query planner not optimized)";
        }
        
        $conn = null;
        
        return [
            'optimized' => empty($issues),
            'issues' => $issues,
            'index_count' => $indexCount,
            'wal_enabled' => (strtolower($walMode) == 'wal'),
            'cache_size' => $cacheSize
        ];
        
    } catch (PDOException $e) {
        return [
            'optimized' => false,
            'issues' => ['Error checking database: ' . $e->getMessage()],
            'index_count' => 0,
            'wal_enabled' => false,
            'cache_size' => 0
        ];
    }
}

function showOptimizationBanner() {
    $status = isDatabaseOptimized();
    
    if (!$status['optimized']) {
        echo '<div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            margin: 10px 0;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">';
        
        echo '<div style="flex: 1;">';
        echo '<strong style="font-size: 16px;">⚡ Database Not Optimized</strong><br>';
        echo '<span style="font-size: 13px; opacity: 0.9;">Your database could be 40-90% faster!</span>';
        echo '<ul style="margin: 8px 0 0 20px; font-size: 12px; opacity: 0.85;">';
        foreach ($status['issues'] as $issue) {
            echo "<li>$issue</li>";
        }
        echo '</ul>';
        echo '</div>';
        
        echo '<div>';
        echo '<a href="optimize-database.php" style="
            background: white;
            color: #667eea;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        " onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">
             Optimize Now (It may take a few min....)
        </a>';
        echo '</div>';
        
        echo '</div>';
    } else {
        // Show simple success message
        echo '<div style="
            background: #10b981;
            color: white;
            padding: 8px 15px;
            margin: 10px 0;
            border-radius: 5px;
            font-size: 13px;
            display: inline-block;
        ">';
        echo '✅ Database already optimized';
        echo '</div>';
    }
}

// Quick function to get optimization status as text
function getOptimizationStatus() {
    $status = isDatabaseOptimized();
    
    if ($status['optimized']) {
        return "✅ Optimized";
    } else {
        return "⚠️ Needs Optimization (" . count($status['issues']) . " issues)";
    }
}

?>