import {
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
} from "./firebase-adm.js";

document.addEventListener("DOMContentLoaded", function () {
  let loadedNews = []; // Armazena as notícias carregadas
  const newsContainer = document.getElementById("news-list");

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

  /**
   * Renderiza a lista de notícias na página principal.
   * @param {Array} newsItems - Array de objetos de notícia.
   */
  function renderNews(newsItems) {
    if (!newsContainer) return;
    newsContainer.innerHTML = "";

    // Idealmente, as notícias seriam ordenadas por data, mas como a data é uma string,
    // vamos apenas renderizá-las na ordem que vêm do DB por enquanto.
    newsItems.forEach((newsItem) => {
      const newsCard = document.createElement("a");
      newsCard.href = newsItem.link || "#";
      newsCard.className = "news-card";
      if (newsItem.link && newsItem.link !== "#") {
        newsCard.target = "_blank";
        newsCard.rel = "noopener noreferrer";
      }

      const img = document.createElement("img");
      img.src = newsItem.imageSrc;
      img.alt = newsItem.imageAlt;
      newsCard.appendChild(img);

      const textContentDiv = document.createElement("div");
      textContentDiv.className = "news-text-content";

      const dateSpan = document.createElement("span");
      dateSpan.className = "news-date";
      dateSpan.textContent = newsItem.date;
      textContentDiv.appendChild(dateSpan);

      const titleH3 = document.createElement("h3");
      titleH3.className = "news-title";
      titleH3.textContent = newsItem.title;
      textContentDiv.appendChild(titleH3);

      const summaryP = document.createElement("p");
      summaryP.className = "news-summary";
      summaryP.textContent = newsItem.summary;
      textContentDiv.appendChild(summaryP);

      newsCard.appendChild(textContentDiv);
      newsContainer.appendChild(newsCard);
    });
  }

  /**
   * Carrega as notícias do Firestore.
   */
  async function loadNews() {
    try {
      const newsCollectionRef = collection(db, "pages", "trabalhos", "items");
      const querySnapshot = await getDocs(newsCollectionRef);

      if (querySnapshot.empty) {
        console.log("Nenhuma notícia encontrada no banco de dados.");
        loadedNews = [];
        renderNews([]);
        return;
      }

      loadedNews = [];
      querySnapshot.forEach((doc) => {
        loadedNews.push({ id: doc.id, ...doc.data() });
      });
      renderNews(loadedNews);
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
      if (newsContainer) {
        newsContainer.innerHTML = "<p>Erro ao carregar notícias.</p>";
      }
    }
  }

  // --- Lógica para o Modal de Edição ---
  const openEditModalBtn = document.getElementById("open-edit-modal");
  const editModal = document.getElementById("edit-modal");
  const pageContentRef = doc(db, "pages", "trabalhos");

  async function loadPageContent() {
    try {
      const docSnap = await getDoc(pageContentRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.querySelector(".summary-title").textContent =
          data.title || "Trabalhos realizados";
        document.querySelector(".summary-subtitle").textContent =
          data.subtitle ||
          "A atuação da associação vai muito além! Confira nossas ações!";
      } else {
        console.log(
          "Documento de conteúdo da página não encontrado, usando valores padrão."
        );
      }
    } catch (error) {
      console.error("Erro ao carregar conteúdo da página:", error);
    }
  }

  /**
   * Cria o formulário de edição para uma notícia individual.
   * @param {object} newsItem - O objeto da notícia. Se vazio, cria um formulário para uma nova.
   * @returns {HTMLElement} - O elemento do formulário.
   */
  function createNewsEditForm(newsItem = {}) {
    const formId = newsItem.id || `new-${Date.now()}`;
    const container = document.createElement("div");
    container.className = "form-section";
    container.dataset.newsId = formId;

    container.innerHTML = `
      <button type="button" class="remove-item-btn">Remover</button>
      <h4>Notícia: ${newsItem.title || "(Nova)"}</h4>
      <div class="form-group">
        <label for="news-title-${formId}">Título:</label>
        <input type="text" id="news-title-${formId}" class="news-title-input" value="${
      newsItem.title || ""
    }" required>
      </div>
      <div class="form-group">
        <label for="news-date-${formId}">Data (ex: 15 de Julho, 2024):</label>
        <input type="text" id="news-date-${formId}" class="news-date-input" value="${
      newsItem.date || ""
    }" required>
      </div>
      <div class="form-group">
        <label for="news-summary-${formId}">Resumo:</label>
        <textarea id="news-summary-${formId}" class="news-summary-input" rows="3" required>${
      newsItem.summary || ""
    }</textarea>
      </div>
      <div class="form-group">
        <label for="news-link-${formId}">Link (opcional):</label>
        <input type="text" id="news-link-${formId}" class="news-link-input" value="${
      newsItem.link || ""
    }">
      </div>
      <div class="form-group">
        <label>Imagem da Notícia:</label>
        <div class="image-upload-container">
          <img src="${
            newsItem.imageSrc || ""
          }" alt="Pré-visualização" class="image-preview" id="news-img-preview-${formId}">
          <input type="file" id="news-img-${formId}" class="news-img-input" accept="image/*">
        </div>
      </div>
    `;

    container
      .querySelector(".remove-item-btn")
      .addEventListener("click", () => {
        if (
          confirm(
            "Tem certeza que deseja remover esta notícia? A remoção será permanente ao salvar."
          )
        ) {
          container.dataset.deleted = "true";
          container.style.display = "none";
        }
      });

    const fileInput = container.querySelector(".news-img-input");
    const preview = container.querySelector(".image-preview");
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) {
        preview.src = URL.createObjectURL(file);
      }
    });

    return container;
  }

  if (openEditModalBtn && editModal) {
    const closeEditModalBtn = document.getElementById("close-edit-modal");
    const cancelEditBtn = document.getElementById("cancel-edit");
    const editForm = document.getElementById("edit-form");
    const newsEditList = document.getElementById("news-edit-list");
    const addNewsBtn = document.getElementById("add-news-btn");

    function populateEditForm() {
      const currentTitle = document.querySelector(".summary-title").textContent;
      const currentSubtitle =
        document.querySelector(".summary-subtitle").textContent;
      document.getElementById("edit-title").value = currentTitle.trim();
      document.getElementById("edit-subtitle").value = currentSubtitle.trim();

      newsEditList.innerHTML = "";
      // Idealmente, ordenar por data aqui também
      loadedNews.forEach((newsItem) => {
        const formElement = createNewsEditForm(newsItem);
        newsEditList.appendChild(formElement);
      });
    }

    addNewsBtn.addEventListener("click", () => {
      const newForm = createNewsEditForm();
      newsEditList.prepend(newForm);
    });

    async function saveChanges(event) {
      event.preventDefault();
      const submitButton = editForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Salvando...";

      try {
        // 1. Salvar título e subtítulo da página
        const newTitle = document.getElementById("edit-title").value;
        const newSubtitle = document.getElementById("edit-subtitle").value;
        await setDoc(pageContentRef, {
          title: newTitle,
          subtitle: newSubtitle,
        });

        // 2. Processar cada formulário de notícia
        const newsForms = newsEditList.querySelectorAll(".form-section");
        const promises = [];

        for (const form of newsForms) {
          const newsId = form.dataset.newsId;
          const isNew = newsId.startsWith("new-");

          if (form.dataset.deleted === "true") {
            if (!isNew) {
              promises.push(
                deleteDoc(doc(db, "pages", "trabalhos", "items", newsId))
              );
            }
            continue;
          }

          const title = form.querySelector(".news-title-input").value;
          const date = form.querySelector(".news-date-input").value;
          const summary = form.querySelector(".news-summary-input").value;
          const link = form.querySelector(".news-link-input").value;
          const imageInput = form.querySelector(".news-img-input");
          const imagePreview = form.querySelector(".image-preview");

          const newsData = {
            title,
            date,
            summary,
            link: link || "#",
            imageAlt: `Imagem da notícia: ${title}`,
            imageSrc: imagePreview.src,
          };

          const saveProcess = async () => {
            if (imageInput.files[0]) {
              const file = imageInput.files[0];
              newsData.imageSrc = await fileToBase64(file);
            }

            if (isNew) {
              await addDoc(
                collection(db, "pages", "trabalhos", "items"),
                newsData
              );
            } else {
              await setDoc(
                doc(db, "pages", "trabalhos", "items", newsId),
                newsData
              );
            }
          };

          promises.push(saveProcess());
        }

        await Promise.all(promises);

        // 3. Atualizar UI e fechar modal
        await loadPageContent();
        await loadNews();
        alert("Alterações salvas com sucesso!");
        editModal.style.display = "none";
      } catch (error) {
        console.error("Erro ao salvar alterações: ", error);
        alert(
          "Falha ao salvar as alterações. Verifique o console para mais detalhes."
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Salvar Alterações";
      }
    }

    openEditModalBtn.addEventListener("click", () => {
      populateEditForm();
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

    editForm.addEventListener("submit", saveChanges);
  }

  // Carrega os dados iniciais da página
  loadPageContent();
  loadNews();
});
