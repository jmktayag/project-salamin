[17:43:25.967] Running build in Washington, D.C., USA (East) – iad1
[17:43:25.968] Build machine configuration: 2 cores, 8 GB
[17:43:25.994] Cloning github.com/jmktayag/project-salamin (Branch: feature/profile-management-ui, Commit: bf823ce)
[17:43:26.450] Cloning completed: 456.000ms
[17:43:28.354] Restored build cache from previous deployment (ADKmXHbErtimk8PYqwf5wRiXd23E)
[17:43:31.786] Running "vercel build"
[17:43:32.524] Vercel CLI 44.4.3
[17:43:33.105] Installing dependencies...
[17:43:36.263] npm error code ERESOLVE
[17:43:36.264] npm error ERESOLVE could not resolve
[17:43:36.264] npm error
[17:43:36.264] npm error While resolving: @firebase/rules-unit-testing@5.0.0
[17:43:36.264] npm error Found: firebase@11.9.1
[17:43:36.264] npm error node_modules/firebase
[17:43:36.264] npm error   firebase@"^11.9.1" from the root project
[17:43:36.264] npm error
[17:43:36.264] npm error Could not resolve dependency:
[17:43:36.264] npm error peer firebase@"^12.0.0" from @firebase/rules-unit-testing@5.0.0
[17:43:36.265] npm error node_modules/@firebase/rules-unit-testing
[17:43:36.265] npm error   dev @firebase/rules-unit-testing@"^5.0.0" from the root project
[17:43:36.265] npm error
[17:43:36.265] npm error Conflicting peer dependency: firebase@12.0.0
[17:43:36.265] npm error node_modules/firebase
[17:43:36.265] npm error   peer firebase@"^12.0.0" from @firebase/rules-unit-testing@5.0.0
[17:43:36.265] npm error   node_modules/@firebase/rules-unit-testing
[17:43:36.265] npm error     dev @firebase/rules-unit-testing@"^5.0.0" from the root project
[17:43:36.265] npm error
[17:43:36.266] npm error Fix the upstream dependency conflict, or retry
[17:43:36.266] npm error this command with --force or --legacy-peer-deps
[17:43:36.266] npm error to accept an incorrect (and potentially broken) dependency resolution.
[17:43:36.266] npm error
[17:43:36.266] npm error
[17:43:36.266] npm error For a full report see:
[17:43:36.266] npm error /vercel/.npm/_logs/2025-07-19T09_43_33_521Z-eresolve-report.txt
[17:43:36.268] npm error A complete log of this run can be found in: /vercel/.npm/_logs/2025-07-19T09_43_33_521Z-debug-0.log
[17:43:36.324] Error: Command "npm install" exited with 1
[17:43:37.200] 
[17:43:40.012] Exiting build container