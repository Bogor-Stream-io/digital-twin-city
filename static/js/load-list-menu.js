// File: static/js/load-list-menu.js
async function loadSidebar() {
    try {
        const res = await fetch("static/data/sensor.json");
        const sensors = await res.json();

        // Group by type
        const grouped = {};
        sensors.forEach(sensor => {
            if (!grouped[sensor.type]) {
                grouped[sensor.type] = [];
            }
            grouped[sensor.type].push(sensor.id);
        });

        // Build sidebar menu
        const sidebar = document.getElementById("sidebar");
        sidebar.innerHTML = `
            <h2 class="text-xl font-bold mb-4">MyCity Digital Map</h2>
            <ul id="menuList"></ul>
        `;

        const menuList = document.getElementById("menuList");

        for (const [type, ids] of Object.entries(grouped)) {
            // Kategori utama
            const li = document.createElement("li");
            li.className = "mb-2";

            const categoryBtn = document.createElement("button");
            categoryBtn.textContent = type.toUpperCase();
            categoryBtn.className = "w-full text-left py-2 px-3 font-semibold bg-gray-700 rounded hover:bg-gray-600";
            li.appendChild(categoryBtn);

            // Sublist untuk id
            const subUl = document.createElement("ul");
            subUl.className = "ml-4 mt-1 space-y-1";

            ids.forEach(id => {
                const subLi = document.createElement("li");
                const subBtn = document.createElement("button");
                subBtn.textContent = id;
                subBtn.className = "w-full text-left py-1 px-3 rounded hover:bg-gray-700";
                subBtn.onclick = () => focusLocation(id);
                subLi.appendChild(subBtn);
                subUl.appendChild(subLi);
            });

            li.appendChild(subUl);
            menuList.appendChild(li);
        }

    } catch (err) {
        console.error("Gagal load sidebar:", err);
    }
}

// jalankan saat halaman load
window.addEventListener("DOMContentLoaded", loadSidebar);

