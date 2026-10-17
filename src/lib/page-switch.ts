let fallback: ReturnType<typeof setTimeout> | undefined;

export function finishPageSwitch() {
  document.documentElement.classList.remove("page-switching");
  if (fallback) clearTimeout(fallback);
  fallback = undefined;
}

export function preparePageSwitch() {
  if (window.scrollY <= 0) return;
  document.documentElement.classList.add("page-switching");
  window.scrollTo({ top: 0, behavior: "auto" });
  if (fallback) clearTimeout(fallback);
  fallback = setTimeout(finishPageSwitch, 2000);
}
