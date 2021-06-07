export default async function ({ addon, global, console, msg }) {
  let topicId = Number(window.location.href.split("/")[5]);
  let page = Number(document.querySelector(".pagination .current.page").innerText);
  let maxPage = Number(document.querySelector(".pagination .page:not(.current)").innerText);

  async function fetchNewPosts() {
    let res = await fetch(`https://scratch.mit.edu/discuss/topic/${topicId}/?page=${maxPage}`).then((res) =>
      res.text()
    );

    let dom = new DOMParser().parseFromString(res, "text/html");

    // load unfound posts
    let oldPosts = Array.from(document.querySelectorAll(".blockpost.roweven.firstpost")).map((el) =>
      Number(el.id.substring(1))
    );
    let newPosts = Array.from(dom.querySelectorAll(".blockpost.roweven.firstpost"));

    for (let j = 0; j < newPosts.length; j++) {
      let post = newPosts[j];

      // Render the post

      document.body.appendChild(post);
    }

    if (document.querySelectorAll(".blockpost.roweven.firstpost").length == 20) {
      clearInterval(fetchNewPosts);
    }
  }
  if (page !== maxPage) return;
}
