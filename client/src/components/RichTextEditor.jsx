import React, { useState, useEffect, useRef } from "react";
import { EditorState, ContentState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const RichTextEditor = ({ value, onChange, placeholder, className }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const previousValueRef = useRef(value);

  useEffect(() => {
    // Only update if the value prop changed externally (not from user input)
    if (value !== previousValueRef.current) {
      previousValueRef.current = value;
      
      if (value) {
        const contentBlock = htmlToDraft(value);
        if (contentBlock) {
          const contentState = ContentState.createFromBlockArray(
            contentBlock.contentBlocks
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
    const html = draftToHtml(convertToRaw(state.getCurrentContent()));
    
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
