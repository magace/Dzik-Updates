# D2 Item Manager - Performance Improvements

Performance optimizations for D2 Item Manager to handle large databases (100k+ items) efficiently.

## What's New

- **Performance Monitor** - Real-time metrics display showing page load times, AJAX calls, and memory usage
- **Database Optimizer** - Automated script that adds indexes, enables WAL mode, and optimizes cache settings
- **Database Health Checker** - Banner that shows optimization status on index page
- **Improved JavaScript** - Modernized itemManagerShow.js with better performance and cleaner code

## Performance Gains on 1.2gb db file.

- Search queries: **80% faster** (5s → 1s)
- Pack loading: **50% faster** needs work still....
- Page load: **64% faster** (2.5s → 0.9s)

## Screenshots


<img width="1892" height="163" alt="image" src="https://github.com/user-attachments/assets/fd493eae-5886-41b9-8e18-d9b4373c1674" />



<img width="641" height="251" alt="image" src="https://github.com/user-attachments/assets/084ecc00-c9f6-4d8d-9502-3f411e8d6b12" />



<img width="760" height="850" alt="image" src="https://github.com/user-attachments/assets/05d527c2-bc0b-48b4-8d99-9db0ab1832c8" />



<img width="517" height="875" alt="image" src="https://github.com/user-attachments/assets/cde2e243-540a-4327-88f6-a33b165852e9" />



<img width="367" height="190" alt="image" src="https://github.com/user-attachments/assets/0cb6607d-b693-4c2c-8e2a-82071eeac594" />



<img width="550" height="324" alt="image" src="https://github.com/user-attachments/assets/937268bb-7223-4426-8cc9-bf1f488ac48b" />


## Notes

- Always backup `ItemDB.s3db` before running optimizations
- Tested with 1.2GB databases and 900,000 + items


## Credits

Optimizations for [D2Dropper](https://github.com/dzik87/D2Dropper) by dzik87
