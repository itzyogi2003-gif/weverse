/* global THREE, Chart */

/**
 * Initialize the WebGL Earth scene using Three.js.
 */
function initEarthScene() {
  const canvas = document.getElementById("earthCanvas");
  if (!canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 3.2);

  const ambient = new THREE.AmbientLight(0x7394ff, 0.9);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 1.05);
  directional.position.set(2.5, 1.5, 3);
  scene.add(directional);

  const earthGeometry = new THREE.SphereGeometry(1, 72, 72);
  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f69cf,
    roughness: 0.78,
    metalness: 0.12
  });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Atmospheric glow shell with additive blending for subtle aura.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.09, 72, 72),
    new THREE.MeshBasicMaterial({
      color: 0x7db4ff,
      transparent: true,
      opacity: 0.17,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(atmosphere);

  // Minimal orbiting stars for depth.
  const particleCount = 150;
  const starsGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const radius = 6 + Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({ color: 0xa7c4ff, size: 0.03, transparent: true, opacity: 0.65 })
  );
  scene.add(stars);

  const onResize = () => {
    const { clientWidth, clientHeight } = canvas.parentElement;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  onResize();
  window.addEventListener("resize", onResize);

  const animate = () => {
    earth.rotation.y += 0.0028;
    earth.rotation.x = Math.sin(Date.now() * 0.00018) * 0.07;
    atmosphere.rotation.y += 0.0032;
    stars.rotation.y += 0.00035;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
}

/**
 * Animate number counters when visible.
 */
function initCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  const runCounter = (element) => {
    const target = Number(element.dataset.counter);
    const duration = 1400;
    const start = performance.now();

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.floor(target * eased);
      element.textContent = target > 100000 ? `$${current.toLocaleString()}` : current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

/**
 * Initialize charts when dashboard section enters viewport.
 */
function initChartsOnScroll() {
  const section = document.getElementById("dashboard-preview");
  if (!section || typeof Chart === "undefined") return;

  let hasRendered = false;

  const renderCharts = () => {
    if (hasRendered) return;
    hasRendered = true;

    new Chart(document.getElementById("allocationChart"), {
      type: "pie",
      data: {
        labels: ["Core Land", "Growth Land", "Campaign Reserve"],
        datasets: [
          {
            data: [46, 34, 20],
            backgroundColor: ["#8fc2ff", "#6e9df5", "#3f5f96"]
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 900 } }
    });

    new Chart(document.getElementById("yieldChart"), {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Yield (%)",
            data: [2.4, 2.9, 3.1, 3.8, 4.2, 4.6],
            borderColor: "#8fc2ff",
            backgroundColor: "rgba(143, 194, 255, 0.18)",
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        animation: { duration: 1000 }
      }
    });

    new Chart(document.getElementById("campaignChart"), {
      type: "bar",
      data: {
        labels: ["Campaign A", "Campaign B", "Campaign C", "Campaign D"],
        datasets: [
          {
            label: "Performance Score",
            data: [76, 91, 83, 97],
            backgroundColor: ["#6f97f0", "#8fc2ff", "#5278cf", "#aacfff"]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, suggestedMax: 100 } },
        animation: { duration: 1100 }
      }
    });
  };

  const chartObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        renderCharts();
        obs.disconnect();
      });
    },
    { threshold: 0.25 }
  );

  chartObserver.observe(section);
}

window.addEventListener("DOMContentLoaded", () => {
  initEarthScene();
  initCounters();
  initChartsOnScroll();
});
