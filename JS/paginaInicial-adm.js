import { db, doc, getDoc, setDoc } from "./firebase-adm.js";

document.addEventListener("DOMContentLoaded", function () {
  // --- Lógica do Carrossel ---
  const carousel = document.querySelector(".carousel");
  if (carousel) {
    const slides = carousel.querySelector(".slides");
    const dotsContainer = carousel.querySelector(".dots");
    const totalSlides = slides ? slides.querySelectorAll("img").length : 0;
    let index = 0;
    let interval;

    if (slides && dotsContainer && totalSlides > 0) {
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement("span");
        dot.addEventListener("click", () => {
          index = i;
          updateCarousel();
        });
        dotsContainer.appendChild(dot);
      }

      const dots = dotsContainer.querySelectorAll("span");

      function updateCarousel() {
        slides.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot) => dot.classList.remove("active"));
        if (dots[index]) {
          dots[index].classList.add("active");
        }
      }

      function nextSlide() {
        index = (index + 1) % totalSlides;
        updateCarousel();
      }

      function prevSlide() {
        index = (index - 1 + totalSlides) % totalSlides;
        updateCarousel();
      }

      function startAutoPlay() {
        interval = setInterval(nextSlide, 5000);
      }

      function stopAutoPlay() {
        clearInterval(interval);
      }

      const nextButton = carousel.querySelector(".next");
      const prevButton = carousel.querySelector(".prev");
      if (nextButton) nextButton.addEventListener("click", nextSlide);
      if (prevButton) prevButton.addEventListener("click", prevSlide);

      carousel.addEventListener("mouseenter", stopAutoPlay);
      carousel.addEventListener("mouseleave", startAutoPlay);

      updateCarousel();
      startAutoPlay();
    }
  }

  // --- Lógica para o Modal de Mantimentos ---
  const openModalLink = document.getElementById("open-mantimentos-modal");
  const mantimentosModal = document.getElementById("mantimentos-modal");

  if (openModalLink && mantimentosModal) {
    const closeModalButton = mantimentosModal.querySelector(".modal-close");

    openModalLink.addEventListener("click", function (event) {
      event.preventDefault();
      mantimentosModal.style.display = "flex";
    });

    closeModalButton.addEventListener("click", function () {
      mantimentosModal.style.display = "none";
    });

    mantimentosModal.addEventListener("click", function (event) {
      if (event.target === mantimentosModal) {
        mantimentosModal.style.display = "none";
      }
    });
  }

  // --- Lógica para o dropdown do usuário ---
  const menuTrigger = document.getElementById("user-menu-trigger");
  const dropdownMenu = document.getElementById("user-dropdown-menu");

  if (menuTrigger && dropdownMenu) {
    dropdownMenu.style.display = "none";

    menuTrigger.addEventListener("click", function (event) {
      event.preventDefault();
      if (dropdownMenu.style.display === "none") {
        dropdownMenu.style.display = "flex";
      } else {
        dropdownMenu.style.display = "none";
      }
    });

    window.addEventListener("click", function (event) {
      if (
        !dropdownMenu.contains(event.target) &&
        !menuTrigger.contains(event.target)
      ) {
        dropdownMenu.style.display = "none";
      }
    });
  }

  // --- Lógica para o Modal de Edição ---
  const openEditModalBtn = document.getElementById("open-edit-modal");
  const editModal = document.getElementById("edit-modal");
  const closeEditModalBtn = document.getElementById("close-edit-modal");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const editForm = document.getElementById("edit-form");

  if (!openEditModalBtn || !editModal || !editForm) {
    return;
  }

  /**
   * Converts a file to a Base64 encoded string.
   * @param {File} file The file to convert.
   * @returns {Promise<string>} A promise that resolves with the Base64 string.
   */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  async function loadPageData() {
    const pageContentRef = doc(db, "pages", "paginaInicial");
    try {
      const docSnap = await getDoc(pageContentRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        updateUI(data);
      } else {
        console.log(
          "Documento da página inicial não encontrado. Usando dados do HTML."
        );
      }
    } catch (error) {
      console.error("Erro ao carregar dados da página inicial:", error);
    } finally {
      initializePageData();
    }
  }

  function populateEditForm() {
    // Carrossel
    document.querySelectorAll(".slides img").forEach((imgEl, i) => {
      const preview = document.getElementById(`carousel-img-${i + 1}-preview`);
      if (preview) {
        preview.src = imgEl.getAttribute("src") || "";
      }
    });

    // Botões de Ação
    document.querySelectorAll(".button-container a").forEach((btn, i) => {
      const index = i + 1;
      const linkInput = document.getElementById(`btn${index}-link`);
      if (linkInput) {
        linkInput.value = btn.getAttribute("href") || "";
      }

      const titleEl = btn.querySelector(".button-title");
      const titleInput = document.getElementById(`btn${index}-title`);
      if (titleEl && titleInput) titleInput.value = titleEl.textContent.trim();

      const subtitleEl = btn.querySelector(".button-subtitle");
      const subtitleInput = document.getElementById(`btn${index}-subtitle`);
      if (subtitleInput) {
        subtitleInput.value = subtitleEl ? subtitleEl.textContent.trim() : "";
      }

      const imgEl = btn.querySelector("img");
      const preview = document.getElementById(`btn${index}-img-preview`);
      if (imgEl && preview) preview.src = imgEl.getAttribute("src") || "";
    });

    // Rodapé
    const pixEl = document.querySelector("#chave-pix");
    const pixInput = document.getElementById("footer-pix-text");
    if (pixEl && pixInput) {
      pixInput.value = pixEl.textContent.trim();
    }

    const phoneEl = document.querySelector(".footer-contact p:nth-of-type(1)");
    const phoneInput = document.getElementById("footer-contact-phone");
    if (phoneEl && phoneInput) {
      const phoneMatch = phoneEl.textContent.match(/\(\d{2}\) \d{5}-\d{4}/);
      phoneInput.value = phoneMatch ? phoneMatch[0] : "";
    }

    const addressEl = document.getElementById("footer-address");
    const addressInput = document.getElementById("footer-address-input");
    if (addressEl && addressInput) {
      addressInput.value = addressEl.lastChild.textContent.trim();
    }

    const facebookEl = document.getElementById("social-facebook-text");
    const facebookInput = document.getElementById("footer-social-facebook");
    if (facebookEl && facebookInput) {
      facebookInput.value = facebookEl.textContent.trim();
    }

    const instagramEl = document.getElementById("social-instagram-text");
    const instagramInput = document.getElementById("footer-social-instagram");
    if (instagramEl && instagramInput) {
      instagramInput.value = instagramEl.textContent.trim();
    }

    const qrCodeEl = document.getElementById("footer-qr-code-img");
    const qrCodePreview = document.getElementById("qr-code-preview");
    if (qrCodeEl && qrCodePreview) {
      qrCodePreview.src = qrCodeEl.src;
    }

    const logoEl = document.getElementById("footer-logo-img");
    const logoPreview = document.getElementById("logo-preview");
    if (logoEl && logoPreview) {
      logoPreview.src = logoEl.src;
    }
  }

  function updateUI(data) {
    const updateImageSrc = (imgElement, newSrc) => {
      if (imgElement && newSrc) {
        imgElement.src = newSrc;
      }
    };

    try {
      if (data.carouselImages) {
        data.carouselImages.forEach((src, i) => {
          const img = document.querySelector(`.slides img:nth-child(${i + 1})`);
          updateImageSrc(img, src);
        });
      }

      if (data.actionButtons) {
        data.actionButtons.forEach((buttonData, i) => {
          const btn = document.querySelector(
            `.button-container a:nth-child(${i + 1})`
          );
          if (btn) {
            if (buttonData.link) btn.href = buttonData.link;
            updateImageSrc(btn.querySelector("img"), buttonData.imgSrc);
            const title = btn.querySelector(".button-title");
            if (title) title.textContent = buttonData.title;
            const subtitle = btn.querySelector(".button-subtitle");
            if (subtitle) subtitle.textContent = buttonData.subtitle;
          }
        });
      }

      if (data.footer) {
        const pixEl = document.querySelector("#chave-pix");
        if (pixEl) pixEl.textContent = data.footer.pixText;

        const mantimentosList = document.querySelector("#mantimentos-modal ul");
        if (mantimentosList && data.footer.mantimentosList) {
          mantimentosList.innerHTML = "";
          data.footer.mantimentosList.forEach((itemText) => {
            if (itemText.trim() !== "") {
              const li = document.createElement("li");
              li.textContent = itemText.trim();
              mantimentosList.appendChild(li);
            }
          });
        }

        const phoneEl = document.querySelector(
          ".footer-contact p:nth-of-type(1)"
        );
        if (phoneEl)
          phoneEl.innerHTML = `<strong>Apoio animal:</strong> ${data.footer.contactPhone}`;

        const footerAddressEl = document.getElementById("footer-address");
        if (footerAddressEl)
          footerAddressEl.innerHTML = `<strong>Endereço:</strong> ${data.footer.address}`;

        const modalAddressEl = document.getElementById("modal-address");
        if (modalAddressEl) modalAddressEl.textContent = data.footer.address;

        const facebookEl = document.getElementById("social-facebook-text");
        if (facebookEl) facebookEl.textContent = data.footer.socialFacebook;

        const instagramEl = document.getElementById("social-instagram-text");
        if (instagramEl) instagramEl.textContent = data.footer.socialInstagram;

        updateImageSrc(
          document.getElementById("footer-qr-code-img"),
          data.footer.qrCodeSrc
        );
        updateImageSrc(
          document.getElementById("footer-logo-img"),
          data.footer.logoSrc
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar a interface:", error);
    }
  }

  async function saveFormChanges(event) {
    event.preventDefault();
    const submitButton = editForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Salvando...";

    try {
      const processImage = async (inputId, currentSrc) => {
        const input = document.getElementById(inputId);
        if (input && input.files[0]) {
          return await fileToBase64(input.files[0]);
        }
        return currentSrc;
      };

      const pageData = {
        actionButtons: [],
        footer: {
          pixText: document.getElementById("footer-pix-text").value,
          mantimentosList: document
            .getElementById("footer-mantimentos-list")
            .value.split("\n")
            .filter((item) => item.trim() !== ""),
          contactPhone: document.getElementById("footer-contact-phone").value,
          address: document.getElementById("footer-address-input").value,
          socialFacebook: document.getElementById("footer-social-facebook")
            .value,
          socialInstagram: document.getElementById("footer-social-instagram")
            .value,
        },
        carouselImages: [],
      };

      for (let i = 1; i <= 5; i++) {
        const previewEl = document.getElementById(`carousel-img-${i}-preview`);
        const currentSrc = previewEl ? previewEl.src : "";
        const newBase64 = await processImage(`carousel-img-${i}`, currentSrc);
        pageData.carouselImages.push(newBase64);
      }

      for (let i = 1; i <= 5; i++) {
        const index = i;
        const buttonData = {
          title: document.getElementById(`btn${index}-title`).value,
          subtitle: document.getElementById(`btn${index}-subtitle`).value,
        };
        const linkInput = document.getElementById(`btn${index}-link`);
        if (linkInput) {
          buttonData.link = linkInput.value;
        }

        const previewEl = document.getElementById(`btn${index}-img-preview`);
        const currentSrc = previewEl ? previewEl.src : "";
        buttonData.imgSrc = await processImage(`btn${index}-img`, currentSrc);

        pageData.actionButtons.push(buttonData);
      }

      const qrPreview = document.getElementById("qr-code-preview");
      pageData.footer.qrCodeSrc = await processImage(
        "qr-code",
        qrPreview ? qrPreview.src : ""
      );

      const logoPreview = document.getElementById("logo-preview");
      pageData.footer.logoSrc = await processImage(
        "logo",
        logoPreview ? logoPreview.src : ""
      );

      const pageContentRef = doc(db, "pages", "paginaInicial");
      await setDoc(pageContentRef, pageData);

      updateUI(pageData);
      alert("Alterações salvas com sucesso!");
      editModal.style.display = "none";
    } catch (error) {
      console.error("Erro ao salvar as alterações:", error);
      alert(
        "Ocorreu um erro ao salvar as alterações. Verifique o console para mais detalhes."
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Salvar Alterações";
    }
  }

  function setupImagePreviews() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      const previewId = input.id + "-preview";
      const preview = document.getElementById(previewId);
      if (preview) {
        input.addEventListener("change", () => {
          const file = input.files[0];
          if (file) {
            preview.src = URL.createObjectURL(file);
          }
        });
      }
    });
  }

  function initializePageData() {
    const mantimentosTextarea = document.getElementById(
      "footer-mantimentos-list"
    );
    const mantimentosList = document.querySelector("#mantimentos-modal ul");

    if (mantimentosTextarea && mantimentosList) {
      const items = mantimentosTextarea.value.split("\n");
      mantimentosList.innerHTML = "";
      items.forEach((itemText) => {
        if (itemText.trim() !== "") {
          const li = document.createElement("li");
          li.textContent = itemText.trim();
          mantimentosList.appendChild(li);
        }
      });
    }
  }

  openEditModalBtn.addEventListener("click", () => {
    populateEditForm();
    setupImagePreviews();
    editModal.style.display = "flex";
  });

  closeEditModalBtn.addEventListener("click", () => {
    editModal.style.display = "none";
  });

  cancelEditBtn.addEventListener("click", () => {
    editModal.style.display = "none";
  });

  editModal.addEventListener("click", (event) => {
    if (event.target === editModal) {
      editModal.style.display = "none";
    }
  });

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const firstImagePreview = document.getElementById("carousel-img-1-preview");
    const firstImageInput = document.getElementById("carousel-img-1");
    const hasExistingImage =
      firstImagePreview &&
      firstImagePreview.src &&
      !firstImagePreview.src.endsWith("/");
    const hasNewFile = firstImageInput && firstImageInput.files.length > 0;

    if (!hasExistingImage && !hasNewFile) {
      alert("Por favor, adicione pelo menos a primeira imagem do carrossel.");
      if (firstImageInput) firstImageInput.focus();
      return;
    }

    saveFormChanges(e);
  });

  loadPageData();
});
