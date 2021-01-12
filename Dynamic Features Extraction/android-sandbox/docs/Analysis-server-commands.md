| Command | Alias | Description |
|-|-|-|
| `clear` | `c` | Clear the console |
| `exit` | *none* | Stop the server |
| `info devices` | `i d` | Display information on connected devices |
| `info jobs` | `i j` | Display information on queued jobs |
| `info <uuid>` | `i <uuid>` | Display information on a device or job |
| `watch devices` | `w d` | Enable debug info logging for all devices |
| `watch jobs` | `w j` | Enable showing messages when jobs are added |
| `watch <uuid>` | `w <uuid>` | Enable debug info logging for a device |
| `unwatch devices` | `uw d` | Disable debug info logging for all devices |
| `unwatch jobs` | `uw j` | Disable showing messages when jobs are added |
| `unwatch <uuid>` | `uw <uuid>` | Disable debug info logging for a device |
| `enable devices` | `e d` | Enable all devices |
| `enable <uuid>` | `e <uuid>` | Enable a device |
| `disable devices` | `d d` | Disable all devices |
| `disable <uuid>` | `d <uuid>` | Disable a device |
| `jobs clear [targetState]` | `j c [targetState]` | Clear jobs from local job queue. If provided, set these jobs to target state before removal |
| `jobs reacquire <searchState> [targetState]` | `j r <searchState> [targetState]` | Add jobs with search state from the database. If provided, set these jobs to target state |
| `jobs setstate <uuid> <targetState>` | `j ss <uuid> <targetState>` | Set a job to a specific state |