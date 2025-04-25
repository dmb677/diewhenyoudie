function populateImages(template, container) {
    fetch('/upload-log-read')
        .then(res => res.json())
        .then(d => {
            for (const key in d) {
                const clone = template.content.cloneNode(true);
                clone.querySelector('h3').textContent = d[key].caption;
                d[key].paths.forEach(element => {
                    const img = document.createElement('img');
                    const anchor = document.createElement('a');
                    img.src = element;
                    anchor.href = element;
                    img.classList.add('gallery-image');
                    anchor.appendChild(img);
                    clone.querySelector('span').appendChild(anchor);
                });
                container.appendChild(clone);
            }
        });
}