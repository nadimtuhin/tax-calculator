export const categoryRadios = (page) => page.locator('input[type="radio"][name="taxpayer-category"]');

export const selectCategory = (page, value) =>
  page.locator(`input[type="radio"][name="taxpayer-category"][value="${value}"]`).click();

export const selectedCategory = (page) =>
  page.locator('input[type="radio"][name="taxpayer-category"]:checked').inputValue();
