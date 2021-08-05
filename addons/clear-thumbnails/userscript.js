export default async function ({ addon }) {
  main: while (true) {
    const image = await addon.tab.waitForElement("img", {
      markAsSeen: true,
    });

    const cdn2 = /\/get_image\/(\w+)\/(\d+)_(\d+)x(\d+).(\w+)/;
    const uploads = /\/((?:[a-z]|\/)+)\/(\d+).(\w+)/;

    let match = cdn2.exec(image.src) || uploads.exec(image.src);

    if (match) {
      // uploads 1st param parsing
      if (match.length !== 5) {
        let type = "";

        switch (match[1].split("/")[0]) {
          case "projects":
            type = "project";
            break;
          case "galleries":
            type = "gallery";
            break;
          case "users":
            type = "user";
            break;
          default:
            type = "";
            continue main;
        }

        match[1] = type;
      } else {
        image.width = match[3];
        image.height = match[4];
      }
      image.src = `https://cdn2.scratch.mit.edu/get_image/${match[1]}/${match[2]}_9200x3600.png?time=${Date.now()}`; // Prevent cache
    }
  }
}
