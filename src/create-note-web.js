"use strict";

import React from "react";
import T from "prop-types";
import update from "immutability-helper";
import { Map, Set } from "immutable";
import createClass from "create-react-class";
const EXIF = require("exif-js");
import { ToggleSwitch } from "./toggle";
import { Auth, Game, Tag, Field, FieldData } from "./aris";
import { clicker, withSuccess } from "./utils";
import { uploadImages } from "./photos";

const CreatePhotoBox = createClass({
  displayName: "CreatePhotoBox",
  getDefaultProps: function() {
    return {
      onChooseFile: function() {},
      file: null,
      orientation: null,
      header: "Main image",
      required: true
    };
  },
  getInitialState: function() {
    return {
      highlight: false
    };
  },
  render: function() {
    var stop;
    stop = ev => {
      ev.stopPropagation();
      return ev.preventDefault();
    };
    return (
      <div>
        <form className="file-form">
          <input
            ref="fileInput"
            type="file"
            name="raw_upload"
            onChange={() => {
              var files, ref;
              files = (ref = this.refs.fileInput) != null ? ref.files : void 0;
              if (files != null && files.length > 0) {
                this.props.onChooseFile(files[0]);
              }
            }}
          />
        </form>
        <a
          href="#"
          onClick={clicker(() => {
            this.refs.fileInput.click();
          })}
          className={`photo-drop ${
            this.state.highlight ? "photo-drop-highlight" : ""
          }`}
          onDragEnter={ev => {
            stop(ev);
            this.setState({
              highlight: true
            });
          }}
          onDragExit={ev => {
            stop(ev);
            this.setState({
              highlight: false
            });
          }}
          onDragOver={stop}
          onDrop={ev => {
            var files;
            stop(ev);
            this.setState({
              highlight: false
            });
            files = ev.dataTransfer.files;
            if (files.length > 0) {
              this.props.onChooseFile(files[0]);
            }
          }}
        >
          {this.props.file != null ? (
            <div
              className={`upload-preview exif-${this.props.orientation}`}
              style={{
                backgroundImage: `url(${URL.createObjectURL(this.props.file)})`
              }}
            />
          ) : (
            <div
              className="upload-preview no-image"
              style={{
                backgroundImage: "url(assets/img/icon-cloud-upload.png)"
              }}
            />
          )}
          <div>
            <h3>{this.props.header}</h3>
            <h4>{this.props.required ? "required*" : "optional"}</h4>
          </div>
        </a>
      </div>
    );
  }
});

// Step 1: Upload
export const CreateStep1 = createClass({
  displayName: "CreateStep1",
  propTypes: {
    onCancel: T.func,
    onStartUpload: T.func,
    onProgress: T.func,
    onCreateMedia: T.func,
    auth: T.instanceOf(Auth).isRequired,
    game: T.instanceOf(Game).isRequired,
    fields: T.arrayOf(T.instanceOf(Field))
  },
  getDefaultProps: function() {
    return {
      onCancel: function() {},
      onStartUpload: function() {},
      onProgress: function() {},
      onCreateMedia: function() {}
    };
  },
  getInitialState: function() {
    return {
      file: null, // file that has EXIF tags already loaded
      extraFiles: Map()
    };
  },
  filesReady: function() {
    var field, file, files, j, len, ref;
    if (this.state.file == null && !this.props.game.newFormat()) {
      return;
    }
    files = [];
    files.push({
      field_id: null,
      file: this.state.file
    });
    ref = this.props.fields;
    for (j = 0, len = ref.length; j < len; j++) {
      field = ref[j];
      if (field.field_type !== "MEDIA") {
        continue;
      }
      file = this.state.extraFiles.get(field.field_id, null);
      if (field.required && file == null) {
        return null;
      }
      files.push({
        field_id: field.field_id,
        file: file
      });
    }
    return files;
  },
  beginUpload: function() {
    var files, updateProgress;
    files = this.filesReady();
    if (files == null) {
      return;
    }
    updateProgress = this.props.onProgress;
    uploadImages(
      files.map(({ file }) => {
        return file;
      }),
      this.props.auth,
      this.props.game,
      updateProgress,
      results => {
        var fieldMedia, field_id, i, j, len, media;
        fieldMedia = [];
        for (i = j = 0, len = files.length; j < len; i = ++j) {
          ({ field_id } = files[i]);
          if (i === 0) {
            continue;
          }
          if (results[i] != null) {
            ({ media } = results[i]);
            fieldMedia.push({
              field_id: field_id,
              media_id: media.media_id
            });
          }
        }
        if (results[0]) {
          this.props.onCreateMedia(results[0], fieldMedia);
        } else {
          this.props.onCreateMedia({}, fieldMedia);
        }
      }
    );
    this.props.onStartUpload();
  },
  getEXIF: function(field_id, file) {
    if (file == null) {
      return;
    }
    EXIF.getData(file, () => {
      if (field_id != null) {
        this.setState({
          extraFiles: this.state.extraFiles.set(field_id, file)
        });
      } else {
        this.setState({ file });
      }
    });
  },
  render: function() {
    var field, j, len, pictureSlots, ref;
    pictureSlots = [];
    // main picture
    if (!this.props.game.newFormat()) {
      pictureSlots.push({
        field_id: null,
        currentImage: () => {
          return this.state.file;
        },
        header: "Main image",
        required: true
      });
    }
    // other pictures
    this.props.fields.filter(field => {
      return field.field_type === "MEDIA";
    }).forEach((field) => {
      pictureSlots.push({
        field_id: field.field_id,
        currentImage: () => {
          return this.state.extraFiles.get(field.field_id, null);
        },
        header: field.label,
        required: field.required
      });
    });
    return (
      <div className="create-step-1">
        <div className="create-content">
          <h2>Drop photos into each section</h2>
          {pictureSlots.map(({ field_id, currentImage, header, required }) => {
            var img;
            img = currentImage();
            return (
              <CreatePhotoBox
                key={field_id}
                onChooseFile={file => {
                  this.getEXIF(field_id, file);
                }}
                file={img}
                orientation={
                  img != null ? EXIF.getTag(img, "Orientation") : null
                }
                header={header}
                required={required}
              />
            );
          })}
        </div>
        <div className="create-buttons">
          <a
            href="#"
            className="create-button-gray"
            onClick={clicker(this.props.onCancel)}
          >
            cancel
          </a>
          <a
            href="#"
            className="create-button-white"
            onClick={clicker(this.beginUpload)}
          >
            next
          </a>
        </div>
      </div>
    );
  }
});

const ProgressBar = createClass({
  displayName: "ProgressBar",
  render: function() {
    var percent, ref;
    if (this.props.progress != null) {
      percent = Math.floor(
        ((ref = this.props.progress) != null ? ref : 0) * 100
      );
      return (
        <p
          className="create-progress-bar"
          style={{
            background: `linear-gradient(to right, rgb(99,176,81) 0%,rgb(99,176,81) ${percent}%,rgb(185,220,176) ${percent}%,rgb(185,220,176) 100%)`
          }}
        >
          {`uploading… (${percent}%)`}
        </p>
      );
    } else {
      return null;
    }
  }
});

// Step 2: Caption
export const CreateStep2 = createClass({
  displayName: "CreateStep2",
  propTypes: {
    onEnterCaption: T.func,
    onBack: T.func,
    onCancel: T.func,
    note: T.any,
    categories: T.arrayOf(T.instanceOf(Tag)).isRequired,
    getColor: T.func,
    progress: T.number,
    game: T.instanceOf(Game).isRequired,
  },
  getDefaultProps: function() {
    return {
      onEnterCaption: function() {},
      onBack: function() {},
      onCancel: function() {},
      getColor: function() {}
    };
  },
  componentDidMount: function() {
    var ref;
    this.setState({
      text: this.props.note.caption,
      category:
        (ref = this.props.note.category) != null
          ? ref
          : this.props.categories[0]
    });
  },
  doEnterCaption: function() {
    var text;
    text = this.state.text;
    if (!text.match(/\S/)) {
      alert("Please enter a caption.");
      return;
    }
    this.props.onEnterCaption({
      text: text,
      category: this.state.category
    });
  },
  render: function() {
    return (
      <div className="create-step-2">
        <ProgressBar progress={this.props.progress} />
        <div className="create-content">
          <h2>Choose Tag</h2>
          <div className="create-select-parent">
            <div className="create-select-div">
              <select
                value={this.state.category.tag_id}
                onChange={event => {
                  var cat, j, len, ref, tag, tag_id;
                  tag_id = event.target.value;
                  tag = null;
                  ref = this.props.categories;
                  for (j = 0, len = ref.length; j < len; j++) {
                    cat = ref[j];
                    if (cat.tag_id === parseInt(tag_id)) {
                      tag = cat;
                      break;
                    }
                  }
                  if (tag != null) {
                    this.setState({
                      category: tag
                    });
                  }
                }}
              >
                {this.props.categories.map(cat => {
                  return (
                    <option value={cat.tag_id} key={cat.tag_id}>
                      {cat.tag}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <textarea
            className="create-caption"
            value={this.state.text}
            onChange={e => {
              this.setState({
                text: e.target.value
              });
            }}
            placeholder={this.props.game.prompt || "Enter a caption…"}
          />
        </div>
        <div className="create-buttons">
          {this.props.note.note_id != null ? (
            <span />
          ) : (
            <a
              href="#"
              className="create-button-gray"
              onClick={clicker(this.props.onBack)}
            >
              back
            </a>
          )}
          <a
            href="#"
            className="create-button-white"
            onClick={clicker(this.doEnterCaption)}
          >
            next
          </a>
        </div>
      </div>
    );
  }
});

// Step 3: Location
export const CreateStep3 = createClass({
  displayName: "CreateStep3",
  propTypes: {
    onPickLocation: T.func,
    onBack: T.func,
    onCancel: T.func,
    progress: T.number
  },
  getDefaultProps: function() {
    return {
      onPickLocation: function() {},
      onBack: function() {},
      onCancel: function() {}
    };
  },
  render: function() {
    // TODO show pin with the color from CreateStep2's category
    return (
      <div className="create-step-3-box">
        <div className="create-step-3-padding" />
        <div className="create-step-3-shadow">
          <div className="create-step-3-window" />
          <div className="create-step-3">
            <div className="create-content-center">
              <span>Pick Location</span>
            </div>
            <div className="create-buttons">
              {this.props.note.note_id != null ? (
                <span />
              ) : (
                <a
                  href="#"
                  className="create-button-gray"
                  onClick={clicker(this.props.onBack)}
                >
                  back
                </a>
              )}
              <a
                href="#"
                className="create-button-white"
                onClick={clicker(this.props.onPickLocation)}
              >
                next
              </a>
            </div>
          </div>
          <div className="siftr-map-note create-pin">
            <div className="siftr-map-note-shadow" />
            <div
              className="siftr-map-note-pin"
              style={{
                backgroundColor: "black"
              }}
            />
          </div>
        </div>
      </div>
    );
  }
});

// Step 5: Form
export const CreateStep5 = createClass({
  displayName: "CreateStep5",
  propTypes: {
    onChangeData: T.func,
    onFinish: T.func,
    onBack: T.func,
    onCancel: T.func,
    fields: T.arrayOf(T.instanceOf(Field)),
    field_data: T.arrayOf(T.instanceOf(FieldData)),
    progress: T.number
  },
  getDefaultProps: function() {
    return {
      onChangeData: function() {},
      onFinish: function() {},
      onBack: function() {},
      onCancel: function() {},
      fields: [],
      field_data: []
    };
  },
  finishForm: function() {
    var field, field_data, j, len, ref, ref1;
    field_data = this.props.field_data;
    ref = this.props.fields;
    for (j = 0, len = ref.length; j < len; j++) {
      field = ref[j];
      if (field.field_type === "SINGLESELECT") {
        if (
          field_data.some(data => {
            return data.field_id === field.field_id;
          })
        ) {
        } else {
          field_data.push(
            new FieldData({
              field_id: field.field_id,
              field_option_id: field.options[0].field_option_id
            })
          );
        }
      } else if (
        field.required &&
        ((ref1 = field.field_type) === "TEXT" || ref1 === "TEXTAREA")
      ) {
        if (
          !field_data.some(data => {
            return data.field_id === field.field_id;
          })
        ) {
          alert(`Please fill in the field: ${field.label}`);
          return;
        }
      }
    }
    if (this.props.progress != null) {
      return;
    }
    this.props.onFinish(field_data);
  },
  render: function() {
    return (
      <div className="create-step-5">
        <ProgressBar progress={this.props.progress} />
        <div className="create-content-center">
          {this.props.fields.map(field => {
            var field_data, getText, onChangeData, setText;
            if (field.field_type === "MEDIA") {
              return null;
            }
            return (
              <div key={field.field_id}>
                <div>
                  <p className="create-field-label">
                    {field.label + (field.required ? "*" : "")}
                  </p>
                </div>
                {function() {
                  var ref;
                  field_data = (ref = this.props.field_data) != null ? ref : [];
                  onChangeData = newData => {
                    this.props.onChangeData(newData);
                  };
                  getText = (def = '') => {
                    var data, j, len;
                    for (j = 0, len = field_data.length; j < len; j++) {
                      data = field_data[j];
                      if (data.field_id === field.field_id) {
                        return data.field_data;
                      }
                    }
                    return def;
                  };
                  setText = (event) => {
                    var newData = field_data.filter(
                      data => data.field_id !== field.field_id
                    );
                    newData.push(
                      new FieldData({
                        field_id: field.field_id,
                        field_data: event.target.value,
                      })
                    );
                    return onChangeData(newData);
                  };
                  switch (field.field_type) {
                    case "TEXT":
                      return (
                        <p>
                          <input
                            type="text"
                            value={getText()}
                            onChange={setText}
                            placeholder={field.label}
                          />
                        </p>
                      );
                    case "TEXTAREA":
                      return (
                        <p>
                          <textarea
                            value={getText()}
                            onChange={setText}
                            placeholder={field.label}
                          />
                        </p>
                      );
                    case "SINGLESELECT":
                      return (
                        <div className="create-select-parent">
                          <div className="create-select-div">
                            <select
                              value={(() => {
                                var data, j, len;
                                for (
                                  j = 0, len = field_data.length;
                                  j < len;
                                  j++
                                ) {
                                  data = field_data[j];
                                  if (data.field_id === field.field_id) {
                                    return data.field_option_id;
                                  }
                                }
                                return field.options[0].field_option_id;
                              })()}
                              onChange={event => {
                                const field_option_id = event.target.value;
                                var newData = field_data.filter(
                                  data => data.field_id !== field.field_id
                                );
                                newData.push(
                                  new FieldData({
                                    field_id: field.field_id,
                                    field_option_id: field_option_id
                                  })
                                );
                                return onChangeData(newData);
                              }}
                            >
                              {field.options.map(option => {
                                return (
                                  <option
                                    value={option.field_option_id}
                                    key={option.field_option_id}
                                  >
                                    {option.option}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      );
                    case "MULTISELECT":
                      return field.options.map(option => {
                        var selected;
                        selected = field_data.some(data => {
                          return (
                            data.field_id === field.field_id &&
                            data.field_option_id === option.field_option_id
                          );
                        });
                        return (
                          <p
                            className="create-multi-toggle"
                            key={option.field_option_id}
                          >
                            <ToggleSwitch
                              checked={selected}
                              onClick={newSelected => {
                                var newData = field_data.filter(data => {
                                  return !(
                                    data.field_id === field.field_id &&
                                    data.field_option_id ===
                                      option.field_option_id
                                  );
                                });
                                if (newSelected) {
                                  newData.push(
                                    new FieldData({
                                      field_id: field.field_id,
                                      field_option_id: option.field_option_id
                                    })
                                  );
                                }
                                return onChangeData(newData);
                              }}
                            >
                              {option.option}
                            </ToggleSwitch>
                          </p>
                        );
                      });
                    case 'NUMBER':
                      const num = getText(field.min);
                      return <div>
                        <p>
                          Must be between {field.min} and {field.max}
                        </p>
                        <p className="create-number">
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={num}
                            onChange={setText}
                            onBlur={() => {
                              let x = parseFloat(num) || 0;
                              x -= field.min;
                              x /= field.step;
                              x = Math.round(x);
                              x *= field.step;
                              x += field.min;
                              if (x < field.min) x = field.min;
                              if (x > field.max) x = field.max;
                              setText({target: {value: x}});
                            }}
                          />
                        </p>
                      </div>;
                    default:
                      return <p>(not implemented yet)</p>;
                  }
                }.call(this)}
              </div>
            );
          })}
        </div>
        <div className="create-buttons">
          <a
            href="#"
            className="create-button-gray"
            onClick={clicker(this.props.onBack)}
          >
            back
          </a>
          <a
            href="#"
            className="create-button-blue"
            onClick={clicker(() => {
              this.finishForm();
            })}
          >
            post!
          </a>
        </div>
      </div>
    );
  }
});
