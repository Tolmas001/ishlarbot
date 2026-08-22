import { Markup } from "telegraf";

export interface PaginationOptions {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

export function createPaginationKeyboard(
  currentPage: number,
  totalPages: number,
  callbackPrefix: string
): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons: ReturnType<typeof Markup.button.callback>[] = [];

  // Previous button
  if (currentPage > 1) {
    buttons.push(Markup.button.callback("⬅️ Oldingi", `${callbackPrefix}:${currentPage - 1}`));
  }

  // Page indicator
  buttons.push(Markup.button.callback(`${currentPage}/${totalPages}`, `${callbackPrefix}:${currentPage}`));

  // Next button
  if (currentPage < totalPages) {
    buttons.push(Markup.button.callback("Keyingi ➡️", `${callbackPrefix}:${currentPage + 1}`));
  }

  return Markup.inlineKeyboard([buttons]);
}

export function paginate<T>(items: T[], page: number, itemsPerPage: number): {
  items: T[];
  pagination: PaginationOptions;
} {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    pagination: {
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems
    }
  };
}

export function formatPaginationInfo(pagination: PaginationOptions): string {
  return `Sahifa ${pagination.currentPage}/${pagination.totalPages} (Jami: ${pagination.totalItems} ta)`;
}
