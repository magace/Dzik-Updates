<?php
/**
 * DATABASE BACKUP TOOL
 * Creates a backup of ItemDB.s3db before optimization
 */

set_time_limit(300); // Allow up to 5 minutes for large databases

echo "<h2>💾 Database Backup</h2>";
echo "<hr>";

$sourceFile = 'ItemDB.s3db';
$backupDir = 'backups';
$timestamp = date('Y-m-d_H-i-s');
$backupFile = $backupDir . '/ItemDB_backup_' . $timestamp . '.s3db';

echo "<h3>🔍 Pre-Backup Checks:</h3>";

// Check if source exists
if (!file_exists($sourceFile)) {
    echo "<div style='background: #f8d7da; padding: 15px; border-radius: 5px;'>";
    echo "<strong>❌ Error:</strong> Database file not found: $sourceFile<br>";
    echo "Current directory: " . getcwd() . "<br>";
    echo "Looking for: " . realpath($sourceFile) . "<br>";
    echo "</div>";
    
    // Try to find the file
    echo "<p>Searching for database file...</p>";
    if (file_exists('../ItemDB.s3db')) {
        echo "<p>Found at parent directory! Try accessing from main folder.</p>";
    }
    echo "<p><a href='index.php'>← Go Back</a></p>";
    exit;
}

echo "✅ Database file exists<br>";

$dbSize = filesize($sourceFile) / 1048576;
echo "✅ Database size: " . round($dbSize, 2) . " MB<br>";

// Check if file is readable
if (!is_readable($sourceFile)) {
    echo "<div style='background: #f8d7da; padding: 15px; border-radius: 5px;'>";
    echo "<strong>❌ Error:</strong> Database file is not readable. Check file permissions.";
    echo "</div>";
    exit;
}
echo "✅ Database file is readable<br>";

// Check if we can write to current directory
if (!is_writable('.')) {
    echo "<div style='background: #f8d7da; padding: 15px; border-radius: 5px;'>";
    echo "<strong>❌ Error:</strong> Cannot write to current directory. Check folder permissions.";
    echo "</div>";
    exit;
}
echo "✅ Current directory is writable<br>";

echo "<hr>";

echo "<p><strong>Source:</strong> $sourceFile</p>";
echo "<p><strong>Destination:</strong> $backupFile</p>";
echo "<hr>";

// Create backups directory if it doesn't exist
if (!is_dir($backupDir)) {
    if (!mkdir($backupDir, 0755, true)) {
        echo "<div style='background: #f8d7da; padding: 15px; border-radius: 5px;'>";
        echo "<strong>❌ Error:</strong> Could not create backups directory";
        echo "</div>";
        exit;
    }
    echo "✅ Created backups directory<br>";
}

echo "<h3>Creating backup...</h3>";
echo "<p>Please wait, this may take a minute for large databases...</p>";

// Flush output so user sees progress
ob_flush();
flush();

$startTime = microtime(true);

// Try to copy the file
echo "<div style='background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
echo "⏳ Copying database file... (this may take up to 1 minute for large files)";
echo "</div>";

// Flush output so user sees progress
if (ob_get_level() > 0) {
    ob_flush();
}
flush();

$copySuccess = @copy($sourceFile, $backupFile);

if ($copySuccess) {
    $endTime = microtime(true);
    $duration = round($endTime - $startTime, 2);
    
    $backupSize = filesize($backupFile) / 1048576;
    
    echo "<div style='background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h3 style='margin-top: 0; color: #155724;'>✅ Backup Complete!</h3>";
    echo "<ul>";
    echo "<li><strong>Backup file:</strong> $backupFile</li>";
    echo "<li><strong>Backup size:</strong> " . round($backupSize, 2) . " MB</li>";
    echo "<li><strong>Time taken:</strong> {$duration} seconds</li>";
    echo "<li><strong>Created:</strong> " . date('Y-m-d H:i:s') . "</li>";
    echo "</ul>";
    echo "</div>";
    
    echo "<hr>";
    echo "<h3>🚀 Ready to Optimize!</h3>";
    echo "<p>Your database has been safely backed up. You can now proceed with optimization.</p>";
    
    echo "<div style='margin: 20px 0;'>";
    echo "<a href='optimize-database.php?backup_done=yes' style='
        background: #007bff;
        color: white;
        padding: 15px 30px;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
        font-size: 16px;
        display: inline-block;
    '>▶️ Continue to Optimization</a>";
    echo "</div>";
    
    echo "<hr>";
    echo "<h4>📋 Backup Information:</h4>";
    echo "<ul>";
    echo "<li>All backups are stored in: <code>$backupDir/</code></li>";
    echo "<li>To restore: Simply replace <code>ItemDB.s3db</code> with your backup file</li>";
    echo "<li>Old backups can be manually deleted to save space</li>";
    echo "</ul>";
    
    // List existing backups
    $backups = glob($backupDir . '/ItemDB_backup_*.s3db');
    if (count($backups) > 1) {
        echo "<h4>📂 Previous Backups:</h4>";
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse; background: white;'>";
        echo "<tr><th>Filename</th><th>Size</th><th>Date</th></tr>";
        
        // Sort by date (newest first)
        usort($backups, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        foreach ($backups as $backup) {
            $name = basename($backup);
            $size = round(filesize($backup) / 1048576, 2) . " MB";
            $date = date('Y-m-d H:i:s', filemtime($backup));
            
            echo "<tr>";
            echo "<td><code>$name</code></td>";
            echo "<td>$size</td>";
            echo "<td>$date</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<p style='font-size: 12px; color: #666;'>";
        echo "<em>You have " . count($backups) . " backup(s). Consider deleting old ones to save disk space.</em>";
        echo "</p>";
    }
    
} else {
    echo "<div style='background: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 8px;'>";
    echo "<h3 style='margin-top: 0; color: #721c24;'>❌ Backup Failed!</h3>";
    echo "<p>Could not create backup. Possible reasons:</p>";
    echo "<ul>";
    echo "<li>Insufficient disk space</li>";
    echo "<li>File permissions issue</li>";
    echo "<li>Database is locked (close all connections)</li>";
    echo "</ul>";
    echo "</div>";
    
    echo "<p><a href='index.php'>← Go Back</a></p>";
}

?>

<style>
    body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        background: #f5f5f5;
    }
    h2, h3, h4 {
        color: #333;
    }
    code {
        background: #eee;
        padding: 2px 6px;
        border-radius: 3px;
    }
</style>