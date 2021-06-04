export default async function ({ addon, global, console, msg }) {
  addon.tab.addEventListener("urlChange", (e) => addEmbeds(e.detail.newUrl));

  addEmbeds(window.location.href);

  async function addEmbeds(projectURI) {
    if (!projectURI.includes("editor")) {
      if (!projectURI.includes("fullscreen")) {
        let guiPlayer = await addon.tab.waitForElement(".guiPlayer", { markAsSeen: true });

        let stageWrapper = await addon.tab.waitForElement(".guiPlayer [class*='stage-wrapper_stage-wrapper']", {
          markAsSeen: true,
        });
        stageWrapper.style.display = "none";

        let iframe = document.createElement("iframe");
        iframe.src = `https://turbowarp.org/${location.pathname.split("/")[2]}/embed`;
        iframe.width = "480px";
        iframe.height = "392px";
        iframe.classList.add("sa-custom-player");
        iframe.classList.add("turbowarp");
        iframe.setAttribute("allowfullscreen", true);

        iframe.style = "border: none;";
        guiPlayer.appendChild(iframe);

        let alerts = await addon.tab.waitForElement(".project-info-alert");
        alerts.remove();
      }
    }
  }
}
