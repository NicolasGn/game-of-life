import { createPortal } from 'react-dom';
import './ChangeSizeModal.css';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { Game } from '../../../../core/game';

export type ChangeSizeModalHandle = {
  open: () => void;
};

export type ChangeSizeModalProps = {
  currentSize: number;
  onConfirm: (value: number) => void;
  onCancel?: () => void;
};

export const ChangeSizeModal = forwardRef(
  ({ currentSize, onConfirm, onCancel }: ChangeSizeModalProps, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [size, setSize] = useState(currentSize);

    useImperativeHandle(ref, (): ChangeSizeModalHandle => {
      return {
        open: () => {
          setIsOpen(true);
        },
      };
    });

    if (!isOpen) {
      return;
    }

    return createPortal(
      <div className="change-size-modal">
        <div className="overlay"></div>
        <div className="modal">
          <main>
            <label htmlFor="grid-size">New grid size</label>
            <input
              name="grid-size"
              type="number"
              value={size}
              min={Game.MinSize}
              max={Game.MaxSize}
              onChange={(e) => {
                const value = e.currentTarget.valueAsNumber;

                if (value < Game.MinSize || value > Game.MaxSize) {
                  return;
                }

                setSize(value);
              }}
            />
          </main>
          <footer>
            <button
              className="button-cancel"
              onClick={() => {
                setIsOpen(false);
                onCancel?.();
              }}
            >
              Cancel
            </button>
            <button
              className="button-confirm"
              onClick={() => {
                setIsOpen(false);
                onConfirm(size);
              }}
            >
              Reset game with new size
            </button>
          </footer>
        </div>
      </div>,
      document.body
    );
  }
);
