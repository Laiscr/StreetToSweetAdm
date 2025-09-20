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
  let loadedCampaigns = []; // Armazena as campanhas carregadas

  const campaignsContainer = document.getElementById("campaigns-list");

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
   * Renderiza a lista de campanhas na página principal.
   * @param {Array} campaigns - Array de objetos de campanha.
   */
  function renderCampaigns(campaigns) {
    if (!campaignsContainer) return;

    campaignsContainer.innerHTML = ""; // Limpa o container

    // Ordena por ano, do mais novo para o mais antigo
    const sortedCampaigns = [...campaigns].sort(
      (a, b) => (b.year || 0) - (a.year || 0)
    );

    sortedCampaigns.forEach((campaign) => {
      const campaignItem = document.createElement("div");
      campaignItem.className = "campaign-item";

      const yearSpan = document.createElement("span");
      yearSpan.className = "campaign-year";
      yearSpan.textContent = campaign.year;
      campaignItem.appendChild(yearSpan);

      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      const img = document.createElement("img");
      img.src = campaign.imageSrc;
      img.alt = campaign.imageAlt;
      cardDiv.appendChild(img);
      campaignItem.appendChild(cardDiv);

      const statusLink = document.createElement("a");
      statusLink.href = campaign.link || "#";
      const isOngoing = campaign.status === "ongoing";
      const statusClass = isOngoing ? "status-ongoing" : "status-closed";
      const statusText = isOngoing ? "Em andamento" : "Encerrada";
      statusLink.className = `campaign-status ${statusClass}`;
      statusLink.textContent = statusText;
      if (!isOngoing) {
        statusLink.onclick = (e) => e.preventDefault();
      }
      campaignItem.appendChild(statusLink);

      campaignsContainer.appendChild(campaignItem);
    });
  }

  /**
   * Carrega as campanhas do Firestore.
   */
  async function loadCampaigns() {
    try {
      const campaignsCollectionRef = collection(
        db,
        "pages",
        "campanhas",
        "items"
      );
      const querySnapshot = await getDocs(campaignsCollectionRef);

      if (querySnapshot.empty) {
        console.log("Nenhuma campanha encontrada no banco de dados.");
        loadedCampaigns = [];
        renderCampaigns([]); // Limpa a tela se não houver campanhas
        return;
      }

      loadedCampaigns = [];
      querySnapshot.forEach((doc) => {
        loadedCampaigns.push({ id: doc.id, ...doc.data() });
      });
      renderCampaigns(loadedCampaigns);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      if (campaignsContainer) {
        campaignsContainer.innerHTML = "<p>Erro ao carregar campanhas.</p>";
      }
    }
  }

  // --- Lógica para o Modal de Edição ---
  const openEditModalBtn = document.getElementById("open-edit-modal");
  const editModal = document.getElementById("edit-modal");
  const pageContentRef = doc(db, "pages", "campanhas");

  async function loadPageContent() {
    try {
      const docSnap = await getDoc(pageContentRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.querySelector(".summary-title").textContent =
          data.title || "Campanhas de vacinação e castração";
        document.querySelector(".summary-subtitle").textContent =
          data.subtitle ||
          "Acompanhe as informações acerca das  campanhas voltadas à causa animal realizadas pela prefeitura de Santa Rita do Sapucaí.";
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
   * Cria o formulário de edição para uma campanha individual.
   * @param {object} campaign - O objeto da campanha. Se vazio, cria um formulário para uma nova.
   * @returns {HTMLElement} - O elemento do formulário.
   */
  function createCampaignEditForm(campaign = {}) {
    const formId = campaign.id || `new-${Date.now()}`;
    const container = document.createElement("div");
    container.className = "form-section";
    container.dataset.campaignId = formId;

    const isOngoing = campaign.status === "ongoing";

    container.innerHTML = `
      <button type="button" class="remove-item-btn">Remover</button>
      <h4>Campanha ${campaign.year || "(Nova)"}</h4>
      <div class="form-group">
        <label for="campaign-year-${formId}">Ano:</label>
        <input type="number" id="campaign-year-${formId}" class="campaign-year-input" value="${
      campaign.year || new Date().getFullYear()
    }" required>
      </div>
      <div class="form-group">
        <label>Imagem do Poster:</label>
        <div class="image-upload-container">
          <img src="${
            campaign.imageSrc || ""
          }" alt="Pré-visualização" class="image-preview" id="campaign-img-preview-${formId}">
          <input type="file" id="campaign-img-${formId}" class="campaign-img-input" accept="image/*">
        </div>
      </div>
      <div class="form-group form-group-checkbox">
        <input type="checkbox" id="campaign-status-${formId}" class="campaign-status-input" ${
      isOngoing ? "checked" : ""
    }>
        <label for="campaign-status-${formId}">Em andamento</label>
      </div>
      <div class="form-group campaign-link-group" style="display: ${
        isOngoing ? "block" : "none"
      };">
        <label for="campaign-link-${formId}">Link de Inscrição (se aplicável):</label>
        <input type="text" id="campaign-link-${formId}" class="campaign-link-input" value="${
      campaign.link || ""
    }">
      </div>
    `;

    // Event listener para o checkbox de status
    const statusCheckbox = container.querySelector(".campaign-status-input");
    const linkGroup = container.querySelector(".campaign-link-group");
    statusCheckbox.addEventListener("change", () => {
      linkGroup.style.display = statusCheckbox.checked ? "block" : "none";
    });

    // Event listener para o botão de remover
    container
      .querySelector(".remove-item-btn")
      .addEventListener("click", () => {
        if (
          confirm(
            "Tem certeza que deseja remover esta campanha? A remoção será permanente ao salvar."
          )
        ) {
          container.dataset.deleted = "true";
          container.style.display = "none"; // Apenas esconde, a remoção real acontece ao salvar.
        }
      });

    // Event listener para a pré-visualização da imagem
    const fileInput = container.querySelector(".campaign-img-input");
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
    const campaignsEditList = document.getElementById("campaigns-edit-list");
    const addCampaignBtn = document.getElementById("add-campaign-btn");

    function populateEditForm() {
      // Popula título e subtítulo
      const currentTitle = document.querySelector(".summary-title").textContent;
      const currentSubtitle =
        document.querySelector(".summary-subtitle").textContent;
      document.getElementById("edit-title").value = currentTitle.trim();
      document.getElementById("edit-subtitle").value = currentSubtitle.trim();

      // Popula a lista de campanhas para edição
      campaignsEditList.innerHTML = "";
      const sortedCampaigns = [...loadedCampaigns].sort(
        (a, b) => b.year - a.year
      );
      sortedCampaigns.forEach((campaign) => {
        const formElement = createCampaignEditForm(campaign);
        campaignsEditList.appendChild(formElement);
      });
    }

    addCampaignBtn.addEventListener("click", () => {
      const newForm = createCampaignEditForm();
      campaignsEditList.prepend(newForm); // Adiciona no topo
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

        // 2. Processar cada formulário de campanha
        const campaignForms =
          campaignsEditList.querySelectorAll(".form-section");
        const promises = [];

        for (const form of campaignForms) {
          const campaignId = form.dataset.campaignId;
          const isNew = campaignId.startsWith("new-");

          // Se marcado para deletar
          if (form.dataset.deleted === "true") {
            if (!isNew) {
              promises.push(
                deleteDoc(doc(db, "pages", "campanhas", "items", campaignId))
              );
            }
            continue; // Pula para o próximo
          }

          // Coleta os dados do formulário
          const year = form.querySelector(".campaign-year-input").value;
          const status = form.querySelector(".campaign-status-input").checked
            ? "ongoing"
            : "closed";
          const link = form.querySelector(".campaign-link-input").value;
          const imageInput = form.querySelector(".campaign-img-input");
          const imagePreview = form.querySelector(".image-preview");

          const campaignData = {
            year: Number(year),
            status: status,
            link: status === "ongoing" ? link : "#",
            imageAlt: `Campanha de ${year}`,
            imageSrc: imagePreview.src, // URL existente ou de um blob local
          };

          // Processo de salvar (conversão de imagem e escrita no DB)
          const saveProcess = async () => {
            // Se uma nova imagem foi selecionada, converte para Base64
            if (imageInput.files[0]) {
              const file = imageInput.files[0];
              campaignData.imageSrc = await fileToBase64(file);
            }

            // Salva no Firestore
            if (isNew) {
              await addDoc(
                collection(db, "pages", "campanhas", "items"),
                campaignData
              );
            } else {
              await setDoc(
                doc(db, "pages", "campanhas", "items", campaignId),
                campaignData
              );
            }
          };

          promises.push(saveProcess());
        }

        await Promise.all(promises);

        // 3. Atualizar UI e fechar modal
        await loadPageContent();
        await loadCampaigns();
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
  loadCampaigns();
});
