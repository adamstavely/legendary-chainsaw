import type { ReactiveController, ReactiveControllerHost } from "lit";

/*
 * The modal behaviour tc-dialog and tc-terms-dialog share: a native <dialog> opened with showModal(), so it sits in
 * the top layer and the rest of the page is inert (Tab and Shift+Tab stay inside, pointer clicks outside don't land),
 * focus goes back to what had it when the dialog closes, and – opt-in – the page behind doesn't scroll.
 *
 *   private readonly modal = new ModalController(this, { dialog: () => this.querySelector("dialog") });
 *   protected override updated() { this.modal.sync(this.open); }
 *
 * The host keeps its own `open` property and its own Escape and close handling (which differs: tc-dialog always
 * asks to close, a blocking terms dialog doesn't); the controller only follows `open`.
 *   · `focus` picks what takes focus on opening; unset, the browser's rule applies (autofocus, else the first control)
 *   · `lockScroll` stops the page scrolling while open; nested locks count, so the page scrolls again only after the
 *     last one is released, and the scrollbar's width is kept as padding so the page doesn't shift
 *   · leaving the page closes the dialog, releases the lock and returns focus
 */

export type ModalOptions = {
  /** The <dialog> to open and close */
  dialog: () => HTMLDialogElement | null;
  /** What gets focus when the dialog opens (after showModal) */
  focus?: () => HTMLElement | null | undefined;
  /** Stop the page behind from scrolling while open */
  lockScroll?: boolean;
};

let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

function lock(doc: Document) {
  if (locks++ > 0) return;
  const root = doc.documentElement;
  const view = doc.defaultView;
  const bar = view ? view.innerWidth - root.clientWidth : 0;
  saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
  root.style.overflow = "hidden";
  if (bar > 0) root.style.paddingRight = `${parseFloat(view!.getComputedStyle(root).paddingRight) + bar}px`;
}

function unlock(doc: Document) {
  if (locks === 0 || --locks > 0) return;
  const root = doc.documentElement;
  root.style.overflow = saved?.overflow ?? "";
  root.style.paddingRight = saved?.paddingRight ?? "";
  saved = null;
}

export class ModalController implements ReactiveController {
  private previous: HTMLElement | null = null;
  private locked = false;
  private shown = false;
  /** Closes this controller made whose `close` event hasn't arrived yet – the event comes a task later */
  private pendingCloses = 0;
  constructor(
    private readonly host: ReactiveControllerHost & HTMLElement,
    private readonly options: ModalOptions,
  ) {
    host.addController(this);
  }

  /** Whether the native dialog is showing */
  get showing() {
    return !!this.options.dialog()?.open;
  }

  /** Opens or closes the native dialog to match `open`; call it from the host's updated() */
  sync(open: boolean) {
    const dialog = this.options.dialog();
    if (!dialog || !this.host.isConnected) return;
    if (open && !dialog.open) {
      if (!this.shown) this.previous = dialog.ownerDocument.activeElement as HTMLElement | null;
      this.shown = true;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      if (this.options.lockScroll && !this.locked) {
        lock(dialog.ownerDocument);
        this.locked = true;
      }
      this.options.focus?.()?.focus();
    } else if (!open && (dialog.open || this.shown)) {
      // Also after the browser closed it on its own: the lock is released and focus goes back
      this.shut(dialog);
    }
  }

  /**
   * Call first in the dialog's `close` handler: true when the event is the echo of a close this controller made, which
   * the host already knows about. Without it, a brief reopened before the echo arrives would be closed by it
   */
  ownClose() {
    if (this.pendingCloses === 0) return false;
    this.pendingCloses--;
    return true;
  }

  /** Re-shows a dialog the browser closed on its own (a second Escape) while the host still wants it open */
  reopen() {
    const dialog = this.options.dialog();
    if (!dialog || dialog.open || !this.host.isConnected) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    this.options.focus?.()?.focus();
  }

  private shut(dialog: HTMLDialogElement | null) {
    this.shown = false;
    if (dialog?.open) {
      if (typeof dialog.close === "function") {
        this.pendingCloses++;
        dialog.close();
      } else dialog.removeAttribute("open");
    }
    if (this.locked) {
      unlock(this.host.ownerDocument);
      this.locked = false;
    }
    const back = this.previous;
    this.previous = null;
    if (back?.isConnected) back.focus();
  }

  hostConnected() {
    // A close whose event never arrived (the element left first) mustn't swallow a real one later
    this.pendingCloses = 0;
  }

  hostDisconnected() {
    this.shut(this.options.dialog());
  }
}
