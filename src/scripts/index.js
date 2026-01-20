import { enableValidation, clearValidation } from "./components/validations.js";
import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { getUserInfo, getCardList, setUserInfo, updateAvatar, addCard, deleteCardFromServer, toggleLike } from "./components/api.js";

const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");

let userId = "";
let cardToDelete = { element: null, id: null };

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

const renderLoading = (isLoading, button) => {
  button.textContent = isLoading ? "Сохранение..." : "Сохранить";
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleDeleteCard = (cardElement, cardId) => {
  deleteCardFromServer(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch(err => console.log(err));
};

const handleLike = (likeButton, cardId, likeCountElement) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  toggleLike(cardId, isLiked)
    .then((updatedCard) => {
      likeButton.classList.toggle("card__like-button_is-active");
      likeCountElement.textContent = updatedCard.likes.length;
    })
    .catch(err => console.log(err));
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton);

  setUserInfo(profileTitleInput.value, profileDescriptionInput.value)
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch(err => console.log(err))
    .finally(() => renderLoading(false, submitButton));
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton);

  updateAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch(err => console.log(err))
    .finally(() => renderLoading(false, submitButton));
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton);
  submitButton.textContent = "Создание...";

  addCard(cardNameInput.value, cardLinkInput.value)
    .then((cardData) => {
      const newCard = createCardElement(
        cardData,
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLike,
          onDeleteCard: confirmCardDeletion,
        },
        userId
      );
      placesWrap.prepend(newCard);
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch(err => console.log(err))
    .finally(() => renderLoading(false, submitButton));
};

const confirmCardDeletion = (cardElement, cardId) => {
  cardToDelete = { element: cardElement, id: cardId };
  openModalWindow(removeCardModalWindow);
};

const handleRemoveCardFormSubmit = (evt) => {
  evt.preventDefault();
  handleDeleteCard(cardToDelete.element, cardToDelete.id);
  closeModalWindow(removeCardModalWindow);
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
removeCardForm.addEventListener("submit", handleRemoveCardFormSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => setCloseModalWindowEventListeners(popup));

enableValidation(validationSettings);

Promise.all([getUserInfo(), getCardList()])
  .then(([userData, cards]) => {
    userId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(
          cardData,
          {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: handleLike,
            onDeleteCard: confirmCardDeletion,
          },
          userId
        )
      );
    });
  })
  .catch(err => console.log(err));

const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info");
const usersStatsModalUsersList = usersStatsModalWindow.querySelector(".popup__list");
const logo = document.querySelector(".logo");

const infoDefinitionTemplate = document.getElementById("popup-info-definition-template");
const userPreviewTemplate = document.getElementById("popup-info-user-preview-template");

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      usersStatsModalInfoList.innerHTML = "";
      usersStatsModalUsersList.innerHTML = "";

      if (cards.length === 0) {
        const noCardsElement = document.createElement("li");
        noCardsElement.textContent = "Нет карточек";
        noCardsElement.classList.add("popup__list-item");
        usersStatsModalInfoList.appendChild(noCardsElement);
        openModalWindow(usersStatsModalWindow);
        return;
      }

      const modalTitle = usersStatsModalWindow.querySelector(".popup__title");
      modalTitle.textContent = "Статистика карточек";
      modalTitle.style.fontWeight = "bold";

      const totalUsers = new Set(cards.map(card => card.owner._id)).size;
      const totalLikes = cards.reduce((sum, card) => sum + card.likes.length, 0);
      const maxLikes = Math.max(...cards.map(card => card.likes.length));
      const championCard = cards.find(card => card.likes.length === maxLikes);
      const championName = championCard ? championCard.owner.name : 'Неизвестный';

      const stats = [
        { term: 'Всего пользователей:', description: totalUsers },
        { term: 'Всего лайков:', description: totalLikes },
        { term: 'Максимально лайков от одного:', description: maxLikes },
        { term: 'Чемпион лайков:', description: championName },
      ];

      stats.forEach(stat => {
        const item = infoDefinitionTemplate.content.cloneNode(true);
        item.querySelector(".popup__info-term").textContent = stat.term;
        item.querySelector(".popup__info-description").textContent = stat.description;
        usersStatsModalInfoList.appendChild(item);
      });

      usersStatsModalWindow.querySelector(".popup__text").textContent = "Популярные карточки:";

      const popularCards = [...cards]
        .sort((a, b) => b.likes.length - a.likes.length)
        .slice(0, 3);

      popularCards.forEach(card => {
        const item = userPreviewTemplate.content.cloneNode(true);
        item.querySelector(".popup__list-item").textContent = card.name;
        usersStatsModalUsersList.appendChild(item);
      });

      openModalWindow(usersStatsModalWindow);
    })
    .catch(err => {
      console.error('Ошибка загрузки статистики:', err);
      usersStatsModalInfoList.innerHTML = '<li class="popup__list-item">Ошибка загрузки</li>';
      openModalWindow(usersStatsModalWindow);
    });
};

logo.style.cursor = "pointer";
logo.addEventListener("click", handleLogoClick);
