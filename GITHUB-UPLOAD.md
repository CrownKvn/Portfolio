# Upload your portfolio to GitHub

## 1. Extract the ZIP

On Windows, right-click the downloaded ZIP and choose **Extract All**. Open the extracted folder containing `index.html`, `assets`, and this guide.

## 2. Upload the extracted contents

1. Sign in to GitHub and open your website repository, or create a public repository named `Portfolio-Site`.
2. Select **Add file > Upload files**. For an empty repository, use the **uploading an existing file** link.
3. Drag all files and folders INSIDE the extracted folder into the upload area. Do not drag the ZIP or the enclosing folder.
4. Enter a commit message such as `Add portfolio website`, then commit to `main` (or the branch you use for publishing).
5. Confirm that `index.html` and the `assets` folder appear directly on the repository home page.

Keep the folder names and capitalization unchanged. Include the bundled font licenses. No build command or npm installation is needed to publish this static site.

## 3. Enable the website

1. Open the repository **Settings > Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** (or your upload branch) and **/ (root)**, then click **Save**.
4. Wait for deployment to finish, then use the website link shown on this page.

With the account `CrownKvn` and repository `Portfolio-Site`, the expected address is:
https://crownkvn.github.io/Portfolio-Site/

The website is not published simply by downloading this ZIP.

## If you use another repository name

Relative asset links already support a repository subfolder. Update the three default URL values in `index.html` (canonical link, `og:url`, and structured-data `url`) to your actual public address so initial metadata matches the deployment.

## Quick troubleshooting

- **404:** Confirm Pages uses the correct branch and `/ (root)`, with `index.html` directly at that location.
- **Missing images/styles:** Upload the entire `assets` folder and preserve its structure and letter case.
- **Old appearance:** Wait for the deployment to complete and refresh with Ctrl+F5.
- **ZIP visible but no website:** Extract it on your computer and upload the contents instead.

Official publishing instructions:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
