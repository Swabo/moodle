<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * The main threedmodel configuration form
 *
 * It uses the standard core Moodle formslib. For more info about them, please
 * visit: http://docs.moodle.org/en/Development:lib/formslib.php
 *
 * @package    mod_threedmodel
 * @copyright  2011 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/moodleform_mod.php');
require_once($CFG->dirroot . '/mod/threedmodel/locallib.php');
require_once($CFG->libdir . '/filelib.php');

/**
 * Module instance settings form
 */
class mod_threedmodel_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {

        $mform = $this->_form;

        //-------------------------------------------------------------------------------
        // Adding the "general" fieldset, where all the common settings are showed
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field
        $mform->addElement('text', 'name', get_string('threedmodelname', 'threedmodel'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEAN);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'threedmodelname', 'threedmodel');

        // Adding the standard "intro" and "introformat" fields
        $this->add_intro_editor();

        //-------------------------------------------------------------------------------
        // Adding the rest of threedmodel settings, spreeading all them into this fieldset
        // or adding more fieldsets ('header' elements) if needed for better logic
        $mform->addElement('static', 'label1', 'threedmodelsetting1', 'Your threedmodel fields go here. Replace me!');

        $mform->addElement('header', 'threedmodelfieldset', get_string('threedmodelfieldset', 'threedmodel'));
        $mform->addElement('static', 'label2', 'threedmodelsetting2', 'Your threedmodel fields go here. Replace me!');



        $filemanager_options = array();
        $filemanager_options['accepted_types'] = '*';
        $filemanager_options['maxbytes'] = 0;
        $filemanager_options['maxfiles'] = 10;
        //$filemanager_options['mainfile'] = true;

        $mform->addElement('filemanager', 'files', get_string('selectfiles'), null, $filemanager_options);

        // $mform->setDefault('display', RESOURCELIB_DISPLAY_EMBED);
        //-------------------------------------------------------------------------------
        // add standard elements, common to all modules
        $this->standard_coursemodule_elements();
        //-------------------------------------------------------------------------------
        // add standard buttons, common to all modules
        $this->add_action_buttons();
    }

//    function data_preprocessing(&$default_values) {
//        if ($this->current->instance) {
//            $draftitemid = file_get_submitted_draft_itemid('files');
//            file_prepare_draft_area($draftitemid, $this->context->id, 'mod_threedmodel', 'content', 0, array('subdirs' => false));
//            $default_values['files'] = $draftitemid;
//        }
////        if (!empty($default_values['displayoptions'])) {
////            $displayoptions = unserialize($default_values['displayoptions']);
////            if (isset($displayoptions['printintro'])) {
////                $default_values['printintro'] = $displayoptions['printintro'];
////            }
////            if (!empty($displayoptions['popupwidth'])) {
////                $default_values['popupwidth'] = $displayoptions['popupwidth'];
////            }
////            if (!empty($displayoptions['popupheight'])) {
////                $default_values['popupheight'] = $displayoptions['popupheight'];
////            }
////            if (!empty($displayoptions['showsize'])) {
////                $default_values['showsize'] = $displayoptions['showsize'];
////            } else {
////                // Must set explicitly to 0 here otherwise it will use system
////                // default which may be 1.
////                $default_values['showsize'] = 0;
////            }
////            if (!empty($displayoptions['showtype'])) {
////                $default_values['showtype'] = $displayoptions['showtype'];
////            } else {
////                $default_values['showtype'] = 0;
////            }
////        }
//    }
//
//    function definition_after_data() {
//        if ($this->current->instance) {
//            // resource not migrated yet
//            return;
//        }
//
//        parent::definition_after_data();
//    }
//
//    function validation($data, $files) {
//        global $USER;
//
//        $errors = parent::validation($data, $files);
//
//        $usercontext = context_user::instance($USER->id);
//        $fs = get_file_storage();
//        if (!$files = $fs->get_area_files($usercontext->id, 'user', 'draft', $data['files'], 'sortorder, id', false)) {
//            $errors['files'] = get_string('required');
//            return $errors;
//        }
//        if (count($files) == 1) {
//            // no need to select main file if only one picked
//            return $errors;
//        } else if (count($files) > 1) {
//            $mainfile = false;
//            foreach ($files as $file) {
//                if ($file->get_sortorder() == 1) {
//                    $mainfile = true;
//                    break;
//                }
//            }
//            // set a default main file
//            if (!$mainfile) {
//                $file = reset($files);
//                file_set_sortorder($file->get_contextid(), $file->get_component(), $file->get_filearea(), $file->get_itemid(), $file->get_filepath(), $file->get_filename(), 1);
//            }
//        }
//        return $errors;
//    }
}
