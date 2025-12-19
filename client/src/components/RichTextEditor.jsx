import React, { useState, useEffect, useRef } from "react";
import { EditorState, ContentState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const RichTextEditor = ({ value, onChange, placeholder, className }) => {
  const [editorState, setEditorState] = useState(() => {
    if (value) {
      const contentBlock = htmlToDraft(value);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(
          contentBlock.contentBlocks,
          contentBlock.entityMap
        );
        return EditorState.createWithContent(contentState);
      }
    }
    return EditorState.createEmpty();
  });
  const previousValueRef = useRef(value);

  useEffect(() => {
    // Only update if the value prop changed externally (not from user input)
    if (value !== previousValueRef.current) {
      previousValueRef.current = value;

      if (value) {
        const contentBlock = htmlToDraft(value);
        if (contentBlock) {
          const contentState = ContentState.createFromBlockArray(
            contentBlock.contentBlocks,
            contentBlock.entityMap
          );
          const newEditorState = EditorState.createWithContent(contentState);
          setEditorState(newEditorState);
        }
      } else {
        setEditorState(EditorState.createEmpty());
      }
    }
  }, [value]);

  const handleEditorChange = (state) => {
    setEditorState(state);
    const currentContent = state.getCurrentContent();
    let html = draftToHtml(convertToRaw(currentContent));

    // Check if content is empty (no text and no entities)
    const hasText = currentContent.hasText();
    const hasEntities = currentContent.getBlockMap().some(
      (block) => block.getEntityAt(0) !== null
    );

    if (!hasText && !hasEntities) {
      html = "";
    } else if (html && html.trim() === "<p></p>") {
      html = "";
    }

    // Update the ref to prevent re-initialization loop
    previousValueRef.current = html;
    onChange(html);
  };

  return (
    <div
      className={`text-slate-900 bg-white rounded-md border border-slate-300 overflow-hidden ${className}`}
    >
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorChange}
        placeholder={placeholder}
        toolbar={{
          options: [
            "inline",
            "blockType",
            "list",
            "textAlign",
            "link",
            "history",
          ],
          inline: {
            options: ["bold", "italic", "underline", "strikethrough"],
          },
          blockType: {
            inDropdown: true,
            options: ["Normal", "H1", "H2", "Blockquote"],
          },
          list: {
            options: ["unordered", "ordered"],
          },
        }}
        editorClassName="px-4 py-2 min-h-[200px] max-h-[400px] overflow-y-auto"
        toolbarClassName="border-b border-slate-300"
        wrapperClassName="flex flex-col h-full"
      />
    </div>
  );
};

export default RichTextEditor;
