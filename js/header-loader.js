(function () {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "header.html", false);
    xhr.send(null);

    if (xhr.status >= 200 && xhr.status < 300) {
      var content = xhr.responseText;
      var bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        document.write(bodyMatch[1]);
      } else {
        document.write(content);
      }
      return;
    }

    console.error("Failed to load header.html. Status:", xhr.status);
  } catch (err) {
    console.error("Failed to load header.html.", err);
  }
})();
