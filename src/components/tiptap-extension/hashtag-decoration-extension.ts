import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PmNode } from "@tiptap/pm/model";

const HASHTAG_REGEX = /#\w+/g;

const hashtagPluginKey = new PluginKey("hashtagDecoration");

function buildDecorations(doc: PmNode): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    HASHTAG_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = HASHTAG_REGEX.exec(node.text)) !== null) {
      const start = pos + match.index;
      const end = start + match[0].length;
      decorations.push(
        Decoration.inline(start, end, {
          class: "hashtag-decoration",
        })
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const HashtagDecoration = Extension.create({
  name: "hashtagDecoration",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: hashtagPluginKey,
        state: {
          init(_, state) {
            return buildDecorations(state.doc);
          },
          apply(tr, oldDecorations) {
            if (tr.docChanged) {
              return buildDecorations(tr.doc);
            }
            return oldDecorations;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
