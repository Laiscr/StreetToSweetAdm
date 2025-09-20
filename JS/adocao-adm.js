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
  let loadedAnimals = []; // Armazena os animais carregados
  const animalListContainer = document.getElementById("animal-list");

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

  // Função para gerar as tags de características
  function createTagsHtml(animal) {
    let tagsHtml = "";
    if (animal.gender === "female") {
      tagsHtml += `<span class="animal-tag gender-female">Fêmea</span>`;
    } else {
      tagsHtml += `<span class="animal-tag gender-male">Macho</span>`;
    }
    if (animal.isVaccinated) {
      tagsHtml += `<span class="animal-tag status-vaccinated">Vacinado</span>`;
    }
    if (animal.isNeutered) {
      tagsHtml += `<span class="animal-tag status-neutered">Castrado</span>`;
    }
    return tagsHtml;
  }

  // Função para abrir e preencher o modal de DETALHES
  function openDetailModal(animal) {
    document.getElementById("modal-animal-image").src = animal.image;
    document.getElementById(
      "modal-animal-image"
    ).alt = `Foto de ${animal.name}`;
    document.getElementById("modal-animal-name").textContent = animal.name;
    document.getElementById("modal-animal-age").textContent = animal.age;
    document.getElementById("modal-animal-size").textContent = animal.size;
    document.getElementById("modal-animal-gender").textContent =
      animal.gender === "female" ? "Fêmea" : "Macho";
    document.getElementById("modal-animal-neutered").textContent =
      animal.isNeutered ? "Sim" : "Não";
    document.getElementById("modal-animal-vaccinated").textContent =
      animal.isVaccinated ? "Sim" : "Não";
    document.getElementById("modal-animal-temperament").textContent =
      animal.temperament;

    // Exibe o modal
    document.getElementById("animal-modal").style.display = "flex";
  }

  // Função para fechar o modal
  function closeDetailModal() {
    document.getElementById("animal-modal").style.display = "none";
  }

  // Adiciona eventos para fechar o modal
  document
    .querySelector("#animal-modal .modal-close")
    .addEventListener("click", closeDetailModal);
  document
    .querySelector(".modal-overlay")
    .addEventListener("click", (event) => {
      // Fecha o modal apenas se o clique for no fundo (overlay) e não no conteúdo
      if (event.target === document.querySelector(".modal-overlay")) {
        closeDetailModal();
      }
    });

  /**
   * Renderiza a lista de animais na página principal.
   * @param {Array} animals - Array de objetos de animais.
   */
  function renderAnimals(animals) {
    if (!animalListContainer) return;
    animalListContainer.innerHTML = "";

    animals.forEach((animal) => {
      const card = document.createElement("a");
      card.className = "animal-card";
      card.href = "#";
      card.dataset.animalId = animal.id;

      const cardHtml = `
        <img src="${animal.image}" alt="Foto de ${animal.name}" />
        <div class="animals-button-text-container">
          <div class="animal-attribute-row"><span class="animals-button-characteristics">Nome: </span><span class="animals-button-definitions">${
            animal.name
          }</span></div>
          <div class="animal-attribute-row"><span class="animals-button-characteristics">Idade: </span><span class="animals-button-definitions">${
            animal.age
          }</span></div>
          <div class="animal-attribute-row"><span class="animals-button-characteristics">Porte: </span><span class="animals-button-definitions">${
            animal.size
          }</span></div>
          <div class="animal-tags-container">${createTagsHtml(animal)}</div>
        </div>
      `;
      card.innerHTML = cardHtml;
      animalListContainer.appendChild(card);
    });
  }

  /**
   * Carrega os animais do Firestore.
   */
  async function loadAnimals() {
    try {
      const animalsCollectionRef = collection(db, "pages", "adocao", "items");
      const querySnapshot = await getDocs(animalsCollectionRef);

      if (querySnapshot.empty) {
        console.log("Nenhum animal encontrado no banco de dados.");
        loadedAnimals = [];
        renderAnimals([]);
        return;
      }

      loadedAnimals = [];
      querySnapshot.forEach((doc) => {
        loadedAnimals.push({ id: doc.id, ...doc.data() });
      });
      renderAnimals(loadedAnimals);
    } catch (error) {
      console.error("Erro ao carregar animais:", error);
      if (animalListContainer) {
        animalListContainer.innerHTML = "<p>Erro ao carregar animais.</p>";
      }
    }
  }

  // Adiciona o event listener ao container para abrir o modal de detalhes
  if (animalListContainer) {
    animalListContainer.addEventListener("click", function (event) {
      event.preventDefault();
      const clickedCard = event.target.closest(".animal-card");
      if (clickedCard) {
        const animalId = clickedCard.dataset.animalId;
        const selectedAnimal = loadedAnimals.find(
          (animal) => animal.id === animalId
        );
        if (selectedAnimal) {
          openDetailModal(selectedAnimal);
        }
      }
    });
  }

  // --- Lógica para o Modal de Edição ---
  const openEditModalBtn = document.getElementById("open-edit-modal");
  const editModal = document.getElementById("edit-modal");
  const pageContentRef = doc(db, "pages", "adocao"); // Referência ao documento no Firestore

  async function loadPageContent() {
    try {
      const docSnap = await getDoc(pageContentRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.querySelector(".summary-title").textContent =
          data.title || "Adoção";
        document.querySelector(".summary-subtitle").textContent =
          data.subtitle || "Confira os animais disponíveis para adoção!";
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
   * Cria o formulário de edição para um animal individual.
   * @param {object} animal - O objeto do animal. Se vazio, cria um formulário para um novo.
   * @returns {HTMLElement} - O elemento do formulário.
   */
  function createAnimalEditForm(animal = {}) {
    const formId = animal.id || `new-${Date.now()}`;
    const container = document.createElement("div");
    container.className = "form-section";
    container.dataset.animalId = formId;

    container.innerHTML = `
      <button type="button" class="remove-item-btn">Remover</button>
      <h4>Animal: ${animal.name || "(Novo)"}</h4>
      <div class="form-group">
        <label for="animal-name-${formId}">Nome:</label>
        <input type="text" id="animal-name-${formId}" class="animal-name-input" value="${
      animal.name || ""
    }" required>
      </div>
      <div class="form-group">
        <label for="animal-age-${formId}">Idade:</label>
        <input type="text" id="animal-age-${formId}" class="animal-age-input" value="${
      animal.age || ""
    }" required>
      </div>
      <div class="form-group">
        <label for="animal-temperament-${formId}">Temperamento:</label>
        <input type="text" id="animal-temperament-${formId}" class="animal-temperament-input" value="${
      animal.temperament || ""
    }" required>
      </div>
      <div class="form-group">
        <label for="animal-size-${formId}">Porte:</label>
        <select id="animal-size-${formId}" class="animal-size-input">
          <option value="Pequeno" ${
            animal.size === "Pequeno" ? "selected" : ""
          }>Pequeno</option>
          <option value="Médio" ${
            animal.size === "Médio" ? "selected" : ""
          }>Médio</option>
          <option value="Grande" ${
            animal.size === "Grande" ? "selected" : ""
          }>Grande</option>
        </select>
      </div>
      <div class="form-group">
        <label for="animal-gender-${formId}">Gênero:</label>
        <select id="animal-gender-${formId}" class="animal-gender-input">
          <option value="male" ${
            animal.gender === "male" ? "selected" : ""
          }>Macho</option>
          <option value="female" ${
            animal.gender === "female" ? "selected" : ""
          }>Fêmea</option>
        </select>
      </div>
      <div class="form-group form-group-checkbox">
        <input type="checkbox" id="animal-neutered-${formId}" class="animal-neutered-input" ${
      animal.isNeutered ? "checked" : ""
    }>
        <label for="animal-neutered-${formId}">Castrado</label>
      </div>
      <div class="form-group form-group-checkbox">
        <input type="checkbox" id="animal-vaccinated-${formId}" class="animal-vaccinated-input" ${
      animal.isVaccinated ? "checked" : ""
    }>
        <label for="animal-vaccinated-${formId}">Vacinado</label>
      </div>
      <div class="form-group">
        <label>Foto:</label>
        <div class="image-upload-container">
          <img src="${
            animal.image || ""
          }" alt="Pré-visualização" class="image-preview" id="animal-img-preview-${formId}">
          <input type="file" id="animal-img-${formId}" class="animal-img-input" accept="image/*">
        </div>
      </div>
    `;

    container
      .querySelector(".remove-item-btn")
      .addEventListener("click", () => {
        if (confirm("Tem certeza que deseja remover este animal?")) {
          container.dataset.deleted = "true";
          container.style.display = "none";
        }
      });

    const fileInput = container.querySelector(".animal-img-input");
    const preview = container.querySelector(".image-preview");
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) preview.src = URL.createObjectURL(file);
    });

    return container;
  }

  if (openEditModalBtn && editModal) {
    const closeEditModalBtn = document.getElementById("close-edit-modal");
    const cancelEditBtn = document.getElementById("cancel-edit");
    const editForm = document.getElementById("edit-form");
    const animalsEditList = document.getElementById("animals-edit-list");
    const addAnimalBtn = document.getElementById("add-animal-btn");

    function populateEditForm() {
      const currentTitle = document.querySelector(".summary-title").textContent;
      const currentSubtitle =
        document.querySelector(".summary-subtitle").textContent;
      document.getElementById("edit-title").value = currentTitle.trim();
      document.getElementById("edit-subtitle").value = currentSubtitle.trim();

      animalsEditList.innerHTML = "";
      loadedAnimals.forEach((animal) => {
        const formElement = createAnimalEditForm(animal);
        animalsEditList.appendChild(formElement);
      });
    }

    addAnimalBtn.addEventListener("click", () => {
      const newForm = createAnimalEditForm();
      animalsEditList.prepend(newForm);
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

        // 2. Processar cada formulário de animal
        const animalForms = animalsEditList.querySelectorAll(".form-section");
        const promises = [];

        for (const form of animalForms) {
          const animalId = form.dataset.animalId;
          const isNew = animalId.startsWith("new-");

          if (form.dataset.deleted === "true") {
            if (!isNew) {
              promises.push(
                deleteDoc(doc(db, "pages", "adocao", "items", animalId))
              );
            }
            continue;
          }

          const name = form.querySelector(".animal-name-input").value;
          const imageInput = form.querySelector(".animal-img-input");
          const imagePreview = form.querySelector(".image-preview");

          const animalData = {
            name: name,
            age: form.querySelector(".animal-age-input").value,
            temperament: form.querySelector(".animal-temperament-input").value,
            size: form.querySelector(".animal-size-input").value,
            gender: form.querySelector(".animal-gender-input").value,
            isNeutered: form.querySelector(".animal-neutered-input").checked,
            isVaccinated: form.querySelector(".animal-vaccinated-input")
              .checked,
            image: imagePreview.src, // URL existente ou de um blob local
          };

          const saveProcess = async () => {
            // Se uma nova imagem foi selecionada, converte para Base64
            if (imageInput.files[0]) {
              const file = imageInput.files[0];
              animalData.image = await fileToBase64(file);
            }

            // Salva no Firestore
            if (isNew) {
              await addDoc(
                collection(db, "pages", "adocao", "items"),
                animalData
              );
            } else {
              await setDoc(
                doc(db, "pages", "adocao", "items", animalId),
                animalData
              );
            }
          };

          promises.push(saveProcess());
        }

        await Promise.all(promises);

        // 3. Atualizar UI e fechar modal
        await loadPageContent();
        await loadAnimals();
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

  // Carrega o conteúdo da página (título/subtítulo) e a lista de animais
  loadPageContent();
  loadAnimals();
});
