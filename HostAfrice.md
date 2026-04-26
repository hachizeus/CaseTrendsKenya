Here is your Standard Operating Procedure (SOP) for every new update:

Phase 1: Local Preparation
Build your project: On your local machine, run your build command (usually npm run build).

Verify the dist folder: Ensure your local dist folder has the newest version of your index.html and assets.

Zip the dist folder: (Optional but recommended) Zipping the dist folder makes the upload much faster than uploading thousands of tiny files individually.

Phase 2: The Upload (File Manager)
Navigate to nodeapp: Open the HostAfrica File Manager and go to your project folder.

Delete the old dist: Delete the current dist folder inside nodeapp.

Upload & Extract: Upload your new dist folder (or your dist.zip and extract it).

Update server.js or .env: Only if you made changes to your backend logic or database keys.

Phase 3: The Deployment (SSH Terminal)
Open your terminal and run these commands in order:

Step 1: Enter the environment

Bash
source $(find /home/casetren/nodevenv -name "activate" | head -n 1)
cd /home/casetren/domains/casetrendskenya.co.ke/nodeapp
Step 2: Clean the old process
You must stop the background version currently running before you can start the new one:

Bash
pkill -u casetren node
Step 3: Update libraries
Run this if you added any new packages (like a new UI library or a utility):

Bash
npm install
Step 4: Relaunch in the background

Bash
nohup node server.js > output.log 2>&1 &
Phase 4: Verification
Check the log: ```bash
cat output.log

Confirm you see the "✅ Email server running" or "Server started" message.
Hard Refresh: Go to your browser and press Ctrl + F5 to clear the cache and see the new changes.
source $(find /home/casetren/nodevenv -name "activate" | head -n 1) && cd /home/casetren/domains/casetrendskenya.co.ke/nodeapp && pkill -u casetren node || true && npm install && nohup node server.js > output.log 2>&1 & sleep 3 && cat output.log